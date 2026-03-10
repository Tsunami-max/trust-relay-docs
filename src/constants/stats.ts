/** Single source of truth for Trust Relay platform statistics.
 *  Update these values when the codebase changes — all pages reference this file.
 */
export const STATS = {
  // Test counts
  BACKEND_TESTS: "2,830+",
  FRONTEND_TESTS: "561",
  TOTAL_TESTS: "3,391+",

  // Architecture counts
  SERVICE_MODULES: 63,
  API_ROUTERS: 28,
  API_ENDPOINTS: "120+",
  AI_AGENTS: "17+",
  AI_AGENT_TOOLS: "40+",

  // Pillar counts
  PILLARS_IMPLEMENTED: 6, // P0-P5
  PILLARS_TOTAL: 7, // P0-P6

  // Infrastructure
  DOCKER_SERVICES: 9,
  ALEMBIC_MIGRATIONS: 21,
  ORM_MODELS: 27,
  NEO4J_NODE_LABELS: 18,

  // Regulatory
  EU_REGULATIONS_SEEDED: 16,
  REGULATION_ARTICLES: 67,
  SCOPE_RULES: 33,

  // ADRs
  ADR_COUNT: 17,

  // Data flow
  COMPLIANCE_LOOP_STEPS: 9,
} as const;
