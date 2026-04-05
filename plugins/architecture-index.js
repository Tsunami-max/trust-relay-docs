// @ts-check
'use strict';

/**
 * Docusaurus postBuild plugin: architecture-index
 *
 * Scans all .md/.mdx files under docs/, extracts architecture metadata from
 * YAML frontmatter, builds component/data-flow/dependency maps, calculates
 * backend coverage, identifies stale pages, and writes docs/architecture-index.json
 * to the project root.
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// YAML frontmatter parser (subset — handles the fields we care about)
// ---------------------------------------------------------------------------

/**
 * Parse a YAML value that may be:
 *   - An inline array:  [a, b, c]
 *   - A quoted string:  "foo bar"  or  'foo bar'
 *   - A plain scalar:   foo bar
 *
 * @param {string} raw
 * @returns {string | string[]}
 */
function parseYamlScalar(raw) {
  const trimmed = raw.trim();

  // Inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  // Quoted string
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Extract YAML frontmatter from a markdown file's content.
 * Returns only the architecture-relevant fields:
 *   components, data_flow, depends_on, owners, last_verified, status
 *
 * @param {string} content
 * @returns {Record<string, string | string[]>}
 */
function parseFrontmatter(content) {
  const result = /** @type {Record<string, string | string[]>} */ ({});

  // Frontmatter must start at the very beginning of the file
  if (!content.startsWith('---')) {
    return result;
  }

  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return result;
  }

  const fmBlock = content.slice(3, end).trim();
  const lines = fmBlock.split('\n');

  const ARCH_FIELDS = new Set([
    'components',
    'data_flow',
    'depends_on',
    'owners',
    'last_verified',
    'status',
  ]);

  let currentKey = /** @type {string | null} */ (null);
  let currentList = /** @type {string[] | null} */ (null);

  for (const line of lines) {
    // Detect a top-level key: value pair
    const keyMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/);

    if (keyMatch) {
      // Flush any in-progress list
      if (currentKey !== null && currentList !== null) {
        result[currentKey] = currentList;
        currentList = null;
        currentKey = null;
      }

      const key = keyMatch[1];
      const rest = keyMatch[2].trim();

      if (!ARCH_FIELDS.has(key)) {
        currentKey = null;
        continue;
      }

      if (rest === '' || rest === '|' || rest === '>') {
        // Multi-line list or block scalar — start collecting
        currentKey = key;
        currentList = [];
      } else {
        currentKey = key;
        currentList = null;
        result[key] = parseYamlScalar(rest);
      }
      continue;
    }

    // Detect a list item under the current key:  "  - value"
    const listItemMatch = line.match(/^\s+-\s+(.*)/);
    if (listItemMatch && currentKey !== null && currentList !== null) {
      const val = listItemMatch[1].trim().replace(/^['"]|['"]$/g, '');
      if (val) {
        currentList.push(val);
      }
      continue;
    }

    // Any other line resets multi-line collection
    if (currentKey !== null && currentList !== null) {
      result[currentKey] = currentList;
      currentList = null;
      currentKey = null;
    }
  }

  // Flush remaining list
  if (currentKey !== null && currentList !== null && currentList.length > 0) {
    result[currentKey] = currentList;
  }

  return result;
}

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all files matching the given extensions under `dir`.
 *
 * @param {string} dir
 * @param {string[]} extensions  e.g. ['.md', '.mdx']
 * @param {string[]} [skipDirs]  directory names to skip
 * @returns {string[]}
 */
function collectFiles(dir, extensions, skipDirs = []) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) {
        continue;
      }
      results.push(
        ...collectFiles(path.join(dir, entry.name), extensions, skipDirs),
      );
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Staleness check
// ---------------------------------------------------------------------------

const STALE_DAYS = 30;

/**
 * Returns true if the ISO date string is older than STALE_DAYS days from now.
 *
 * @param {string} dateStr  ISO-8601 date, e.g. "2025-12-01"
 * @returns {boolean}
 */
function isStale(dateStr) {
  try {
    const verified = new Date(dateStr);
    if (isNaN(verified.getTime())) {
      return false;
    }
    const diffMs = Date.now() - verified.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > STALE_DAYS;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * @param {import('@docusaurus/types').LoadContext} context
 * @returns {import('@docusaurus/types').Plugin}
 */
module.exports = function architectureIndexPlugin(context) {
  return {
    name: 'architecture-index',

    async postBuild() {
      console.log('[architecture-index] Building architecture index...');

      // -- Paths -----------------------------------------------------------
      const siteDir = context.siteDir; // docusaurus/trust-relay/
      const projectRoot = path.resolve(siteDir, '../..'); // repo root
      const docsDir = path.join(siteDir, 'docs');
      const backendServicesDir = path.join(
        projectRoot,
        'backend',
        'app',
        'services',
      );
      const backendAgentsDir = path.join(
        projectRoot,
        'backend',
        'app',
        'agents',
      );
      const outputPath = path.join(projectRoot, 'docs', 'architecture-index.json');

      // -- Scan docs -------------------------------------------------------
      const mdFiles = collectFiles(docsDir, ['.md', '.mdx'], ['node_modules']);

      const component_map = /** @type {Record<string, string[]>} */ ({});
      const data_flows = /** @type {Array<{source: string, targets: string[]}>} */ ([]);
      const dependency_graph = /** @type {Record<string, string[]>} */ ({});
      const stale_pages = /** @type {string[]} */ ([]);
      const pages_with_metadata = /** @type {Array<{file: string, metadata: Record<string, string | string[]>}>} */ ([]);

      for (const filePath of mdFiles) {
        const relPath = path.relative(siteDir, filePath);
        let content;
        try {
          content = fs.readFileSync(filePath, 'utf-8');
        } catch {
          continue;
        }

        const fm = parseFrontmatter(content);
        const hasMeta = Object.keys(fm).length > 0;

        if (!hasMeta) {
          continue;
        }

        pages_with_metadata.push({ file: relPath, metadata: fm });

        // component_map: component → [doc pages that mention it]
        const components = fm.components;
        if (components) {
          const list = Array.isArray(components) ? components : [components];
          for (const comp of list) {
            if (!component_map[comp]) {
              component_map[comp] = [];
            }
            component_map[comp].push(relPath);
          }
        }

        // data_flows
        const dataFlow = fm.data_flow;
        if (dataFlow) {
          const targets = Array.isArray(dataFlow) ? dataFlow : [dataFlow];
          data_flows.push({ source: relPath, targets });
        }

        // dependency_graph
        const dependsOn = fm.depends_on;
        if (dependsOn) {
          const deps = Array.isArray(dependsOn) ? dependsOn : [dependsOn];
          dependency_graph[relPath] = deps;
        }

        // stale check
        const lastVerified = fm.last_verified;
        if (
          lastVerified &&
          typeof lastVerified === 'string' &&
          isStale(lastVerified)
        ) {
          stale_pages.push(relPath);
        }
      }

      // -- Backend coverage ------------------------------------------------
      const SKIP_FILES = new Set(['__init__.py']);
      const SKIP_DIRS = ['__pycache__', 'node_modules'];

      const serviceFiles = collectFiles(
        backendServicesDir,
        ['.py'],
        SKIP_DIRS,
      ).filter((f) => !SKIP_FILES.has(path.basename(f)));

      const agentFiles = collectFiles(
        backendAgentsDir,
        ['.py'],
        SKIP_DIRS,
      ).filter((f) => !SKIP_FILES.has(path.basename(f)));

      const allBackendModules = [
        ...serviceFiles.map((f) => ({
          type: 'service',
          name: path.basename(f, '.py'),
          file: path.relative(projectRoot, f),
        })),
        ...agentFiles.map((f) => ({
          type: 'agent',
          name: path.basename(f, '.py'),
          file: path.relative(projectRoot, f),
        })),
      ];

      // Which backend modules are documented?
      // component_map keys are relative paths like "app/services/evoi_engine.py"
      // allBackendModules[i].file is "backend/app/services/evoi_engine.py"
      // Match by stripping leading "backend/" from the module file path.
      const documentedComponents = new Set(Object.keys(component_map));
      const coveredModules = allBackendModules.filter((m) => {
        // Strip "backend/" prefix so "backend/app/services/evoi_engine.py" → "app/services/evoi_engine.py"
        const relNoBackend = m.file.replace(/^backend\//, '');
        return documentedComponents.has(relNoBackend);
      });

      const coveragePercent =
        allBackendModules.length > 0
          ? Math.round((coveredModules.length / allBackendModules.length) * 100)
          : 0;

      const coverage = {
        total_backend_modules: allBackendModules.length,
        documented_modules: coveredModules.length,
        coverage_percent: coveragePercent,
        undocumented: allBackendModules
          .filter((m) => !documentedComponents.has(m.name))
          .map((m) => m.file),
      };

      // -- Assemble output -------------------------------------------------
      const index = {
        generated_at: new Date().toISOString(),
        stats: {
          total_doc_files: mdFiles.length,
          files_with_metadata: pages_with_metadata.length,
          stale_pages: stale_pages.length,
        },
        component_map,
        data_flows,
        dependency_graph,
        stale_pages,
        coverage,
      };

      // -- Write output ----------------------------------------------------
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');

      console.log(
        `[architecture-index] Generated ${outputPath}`,
      );
      console.log(
        `[architecture-index] Scanned ${mdFiles.length} doc files, ` +
          `${pages_with_metadata.length} with architecture metadata, ` +
          `${stale_pages.length} stale.`,
      );
      console.log(
        `[architecture-index] Backend coverage: ${coveredModules.length}/${allBackendModules.length} modules (${coveragePercent}%).`,
      );
    },
  };
};
