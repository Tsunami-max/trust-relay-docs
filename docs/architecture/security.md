---
sidebar_position: 5
title: "Security"
---

# Security Architecture

This page documents the current security posture of Trust Relay. The system has been through a dedicated security remediation phase (Phase 4) and a subsequent multi-tenancy implementation (Pillar 0) that established Keycloak 26 as the sole authentication mechanism with Row Level Security across all tenant-scoped tables.

## Implemented Security Measures

### Officer Authentication (Keycloak 26 + JWT/JWKS)

Officer-facing API endpoints are protected by JWT-based authentication via the `get_current_user` dependency in `app/api/deps/auth.py`. Authentication is provided exclusively by Keycloak 26.

**How it works:**
- Every request requires a valid `Authorization: Bearer <token>` header
- The JWT is validated against the Keycloak JWKS endpoint configured via `auth_jwks_url`
- Issuer (`iss`) and audience (`aud`) claims are verified
- JIT (Just-In-Time) user provisioning ensures database user records are created on first login via `_ensure_db_user()` using the `UserRepository`

```python
# JWKS key rotation: keys are cached for 5 minutes
_JWKS_TTL_SECONDS = 300
```

**Role-Based Access Control (RBAC):** Four roles are defined in Keycloak and enforced by the backend:

| Role | Permissions |
|------|------------|
| `super_admin` | Full system access, tenant management, user management |
| `compliance_manager` | Manage officers, override automation tiers, review escalated cases |
| `officer` | Create and investigate cases, make decisions, interact with copilot |
| `auditor` | Read-only access to cases, audit trails, and investigation results |

### Multi-Tenancy (Row Level Security)

All 22 tenant-scoped database tables are protected by PostgreSQL Row Level Security (RLS) policies with `FORCE ROW LEVEL SECURITY` enabled. The session layer sets the tenant context on every database connection:

- `get_session()` always sets the default tenant context
- `get_tenant_session(tid)` provides explicit tenant-scoped access
- `get_admin_session()` bypasses RLS for cross-tenant administrative operations

This ensures complete data isolation between tenants at the database level, not just the application level.

### Portal Token Authentication with Expiry

Customer access to the upload portal is gated by a cryptographically random token (UUID4, 122 bits of entropy) with a configurable time-to-live.

```
Portal URL: https://portal.example.com/portal/{uuid4-token}
```

**Security controls:**
- Tokens are unique per case and stored in PostgreSQL
- Portal endpoints validate the token against the database
- Tokens cannot be guessed or enumerated
- **30-day TTL**: Tokens have an `expires_at` column, configurable via `portal_token_ttl_days`
- Expired tokens return HTTP 410 Gone
- Rate limiting applies to token validation attempts

### PEPPOL API Key Authentication

The PEPPOL verification service uses API key authentication:

- API keys stored in the `peppol_api_keys` PostgreSQL table
- Keys validated on every request via header: `X-API-Key`
- Each key has a `rate_limit_per_minute` setting (default: 100)
- Keys can be deactivated via the `active` boolean flag

### IP-Based Rate Limiting

A sliding-window rate limiter (`app/api/deps/rate_limiter.py`) protects all endpoints:

| Context | Rate Limit | Key |
|---------|-----------|-----|
| Authenticated requests | 100 requests/minute | IP address |
| Unauthenticated requests | 20 requests/minute | IP address |
| PEPPOL API (per key) | Configurable per API key | API key |

The implementation uses an in-memory sliding window. Production would use Redis or a managed API gateway for distributed rate limiting.

### Dynamic CORS Configuration

CORS origins are configurable via the `CORS_ORIGINS` environment variable:

```bash
# Development (default)
CORS_ORIGINS=http://localhost:3001

# Production (multiple origins)
CORS_ORIGINS=https://app.trustrelay.com,https://portal.trustrelay.com
```

This replaces the previous hardcoded `localhost:3001` configuration.

### File Upload Validation

Document uploads through the portal include:

- Content-type validation against allowed MIME types
- File size limits enforced by the web server
- Files stored in MinIO with case-scoped prefixes, preventing cross-case access
- Documents are processed by Docling in a sandboxed conversion pipeline

### Evidence Chain Integrity

The Belgian evidence service implements a SHA-256 hashing chain for tamper detection:

1. **Per-source hashing** -- Each data source response (KBO, Gazette, NBB, Inhoudingsplicht) is hashed individually
2. **Bundle hashing** -- Individual source hashes are combined into a single bundle hash
3. **Dual persistence** -- Raw data stored in both PostgreSQL (`belgian_evidence` table) and MinIO (JSON archive)

```python
# Per-source hash
hash = sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
# Stored as: "sha256:{hexdigest}"

# Bundle hash
bundle = sha256(json.dumps(source_hashes, sort_keys=True).encode()).hexdigest()
```

The PEPPOL verification service uses the same pattern with its own `EvidenceService`.

### SSRF Protection

Website URL input is validated before scraping:

- URL scheme validation (must be HTTP/HTTPS)
- Domain parsing via `urllib.parse`
- Scraping runs through crawl4ai which has its own URL validation

## Production Security Enhancements

The following enhancements are planned for production hardening:

### PII Classification

The system processes personal data (director names, LinkedIn profiles, document contents). Production deployment will add:

- PII classification tags on model fields
- Encrypted columns for sensitive data
- Data retention and deletion policies
- GDPR data subject request handling

### Enhanced Audit Trail

Authentication is implemented (JWT with JWKS). The next phase will extend audit logging to include:

- Per-request audit logging with caller identity
- Document download events
- Configuration change tracking

### Secret Management

API keys are stored in `.env` files for local development. Production deployment will use a managed secret store (AWS Secrets Manager, HashiCorp Vault, or Kubernetes secrets).

## Production Security Roadmap

| Phase | Items | Status |
|-------|-------|--------|
| **Phase 1** (Pre-production) | Officer authentication (OIDC), token expiry, CORS configuration | **Done** (Phase 4 remediation) |
| **Phase 2** (Launch) | Rate limiting, audit logging with identity | **Partially done** (rate limiting complete, audit logging pending full auth integration) |
| **Phase 3** (Post-launch) | PII classification, data encryption at rest, GDPR compliance, secret management | Planned |
| **Phase 4** (Maturity) | SOC 2 Type II preparation, penetration testing, security monitoring | Planned |

## Security Configuration

All security-related configuration is managed via environment variables through pydantic-settings:

| Variable | Purpose | Default |
|----------|---------|---------|
| `AUTH_JWKS_URL` | JWKS endpoint for Keycloak JWT validation | (Keycloak default) |
| `AUTH_ISSUER` | Expected JWT issuer claim | (Keycloak realm URL) |
| `AUTH_AUDIENCE` | Expected JWT audience claim | (Keycloak client ID) |
| `PORTAL_TOKEN_TTL_DAYS` | Portal token expiry period | `30` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3001` |
| `PEPPOL_MOCK_MODE` | Disables real PEPPOL API calls | `true` |
| `BRIGHTDATA_API_TOKEN` | BrightData MCP authentication | (empty) |
| `TAVILY_API_KEY` | Tavily search API authentication | (empty) |
| `OPENAI_API_KEY` | LLM API authentication | (empty) |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Object storage credentials | `minioadmin` |
| `DATABASE_URL` | PostgreSQL connection string | (local default) |

:::note
Development-only endpoints (`/api/test/mock-modes`) for runtime mock mode toggling are available in the development environment. These endpoints are disabled in production deployment.
:::
