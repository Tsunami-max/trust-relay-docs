import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  architectureSidebar: [
    'architecture/overview',
    {
      type: 'category',
      label: 'System Design',
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
      items: [
        'architecture/backend-structure',
        'architecture/temporal-workflows',
        'architecture/ai-agents',
        'architecture/osint-pipeline',
        'architecture/tiered-scanning',
        'architecture/compliance-memory',
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
    'adr/0015-react-query-caching',
    'adr/0016-tiered-scan-agent',
    'adr/0017-compliance-memory-system',
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
  ],
  strategySidebar: [
    'why-trust-relay',
    'product-overview',
    'trust-lifecycle',
    'portfolio-audit-mode',
    'competitive-landscape',
    'data-moat-strategy',
  ],
};

export default sidebars;
