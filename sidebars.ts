import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  architectureSidebar: [
    'architecture/overview',
    {
      type: 'category',
      label: 'System Design',
      collapsed: false,
      items: [
        'architecture/tech-stack',
        'architecture/data-flow',
        'architecture/state-machine',
        'architecture/security',
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      collapsed: false,
      items: [
        'architecture/backend-structure',
        'architecture/temporal-workflows',
        'architecture/ai-agents',
        'architecture/osint-pipeline',
        'architecture/risk-assessment',
        'architecture/atlas-adoption',
        'architecture/tiered-scanning',
        'architecture/compliance-memory',
        'architecture/multi-country-registries',
        'architecture/goaml-export',
        'architecture/cost-monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      items: [
        'architecture/frontend-structure',
        'architecture/ui-design-system',
      ],
    },
    {
      type: 'category',
      label: 'Data',
      items: [
        'architecture/knowledge-graph',
        'architecture/ontology-layer',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'architecture/deployment',
        'architecture/testing-strategy',
      ],
    },
    {
      type: 'category',
      label: 'Pillars',
      items: [
        'architecture/platform-foundation',
        'architecture/confidence-scoring',
        'architecture/reasoning-templates',
        'architecture/cross-case-patterns',
        'architecture/agentic-os',
        'architecture/evoi-engine',
        'architecture/supervised-autonomy',
        'architecture/regulatory-radar',
        'architecture/session-diagnostics',
        'architecture/case-intelligence',
        'architecture/lex-regulatory-knowledge',
        'architecture/prompt-management',
      ],
    },
    {
      type: 'category',
      label: 'Compliance',
      items: [
        'architecture/regulatory-architecture',
      ],
    },
  ],
  adrSidebar: [
    'adr/index',
    'adr/0001-pydanticai-agui',
    'adr/0002-temporal-sdk',
    'adr/0003-agui-on-fastapi',
    'adr/0004-copilotkit-v1',
    'adr/0005-state-snapshot',
    'adr/0006-peppol-rest',
    'adr/0007-belgian-data-layer',
    'adr/0008-raw-sql',
    'adr/0009-silent-recovery',
    'adr/0010-react-usestate',
    'adr/0011-auth-deferred',
    'adr/0012-hybrid-scraping',
    'adr/0013-copilotkit-v2',
    'adr/0014-neo4j-knowledge-graph',
    'adr/0015-session-diagnostics',
    'adr/0016-shared-regulatory-corpus',
    'adr/0017-trust-capsule',
  ],
  apiSidebar: [
    'api/overview',
    'api/cases',
    'api/portal',
    'api/webhooks',
    'api/scan',
    'api/memory',
    'api/confidence',
    'api/reasoning',
    'api/intelligence',
    'api/agents',
    'api/automation',
    'api/regulatory',
    'api/diagnostics',
    'api/case-intelligence',
  ],
  featuresSidebar: [
    {
      type: 'category',
      label: 'Document Validation',
      items: [
        'features/belgian-eid-validation',
      ],
    },
  ],
  methodologySidebar: [
    'methodology/overview',
    {
      type: 'category',
      label: 'Philosophy',
      items: [
        'methodology/philosophy/design-before-code',
        'methodology/philosophy/human-ai-collaboration',
        'methodology/philosophy/evidence-over-claims',
        'methodology/philosophy/quality-as-architecture',
        'methodology/philosophy/living-documentation',
      ],
    },
    {
      type: 'category',
      label: 'Development Lifecycle',
      items: [
        'methodology/lifecycle/lifecycle-overview',
        'methodology/lifecycle/bug-fix-cycle',
        'methodology/lifecycle/code-review-cycle',
        'methodology/lifecycle/subagent-driven-development',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'methodology/infrastructure/instruction-hierarchy',
        'methodology/infrastructure/agent-architecture',
        'methodology/infrastructure/memory-system',
        'methodology/infrastructure/quality-gates',
        'methodology/infrastructure/mcp-integration',
      ],
    },
    {
      type: 'category',
      label: 'Practices',
      items: [
        'methodology/practices/living-documentation',
        'methodology/practices/regulatory-compliance',
      ],
    },
    {
      type: 'category',
      label: 'Standards',
      items: [
        'methodology/standards/testing-standard',
        'methodology/standards/uiux-standard',
        'methodology/standards/adr-standard',
      ],
    },
    {
      type: 'category',
      label: 'Evidence',
      items: [
        'methodology/evidence/trust-relay-metrics',
      ],
    },
  ],
  releasesSidebar: [
    {
      type: 'category',
      label: 'Sprint Release Notes',
      collapsed: false,
      items: [{type: 'autogenerated', dirName: 'releases'}],
    },
  ],
  strategySidebar: [
    'why-trust-relay',
    'competitive-intelligence',
    'product-overview',
    'trust-lifecycle',
    'portfolio-audit-mode',
    'competitive-landscape',
    'data-moat-strategy',
    'vlaio-development-project',
  ],
};

export default sidebars;
