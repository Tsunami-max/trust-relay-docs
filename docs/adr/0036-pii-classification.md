---
id: 0036-pii-classification
sidebar_position: 37
title: "ADR-0036: PII Classification Architecture"
---

# ADR-0036: PII Classification with Hybrid Annotations and Generated Manifest

**Status:** Accepted
**Date:** 2026-04-07

## Context

Trust Relay stores PII fields across 8+ tables -- all in plaintext PostgreSQL columns. While Row-Level Security (ADR-0023) enforces tenant isolation at the database level, there is no field-level awareness of what data is personally identifiable. This creates three gaps:

1. **Security questionnaires** -- regulated customers ask "where is PII stored and how is it protected?" and there is no machine-readable answer.
2. **GDPR Art. 30** -- records of processing activities require a formal inventory of personal data fields, their purposes, and retention periods.
3. **Encryption at rest** -- direct identifiers (national IDs, IBANs, document numbers) are stored in plaintext, which is a finding in any security audit.

## Decision

Implement a hybrid annotation + generated manifest architecture in three phases:

**Phase 1 (this ADR):** PII classification metadata on SQLAlchemy columns via `info={"pii": PIIField(...)}`, a `PIIRegistry` that scans models at runtime, and a CLI that generates `docs/pii_manifest.json` -- the GDPR Art. 30 artifact.

**Phase 2:** Alembic migration to convert scalar PII columns to `EncryptedText` (AES-256-GCM via `TypeDecorator`), with HMAC search hashes for indexed lookups.

**Phase 3:** GDPR data subject request endpoints (access, erasure, rectification) using a `person_data_index` table for cross-case person resolution.

**Key design choices:**

1. **Annotations on models, not a separate registry file** -- PII classification lives next to the column definition, making it hard to miss when adding new fields.

2. **Six PII categories** -- `DIRECT_IDENTIFIER`, `QUASI_IDENTIFIER`, `SENSITIVE`, `FINANCIAL`, `CONTACT`, `DOCUMENT`. Three of these (DIRECT_IDENTIFIER, FINANCIAL, CONTACT) require column-level encryption.

3. **Vault-ready `KeyProvider` interface** -- `EnvKeyProvider` reads AES-256 keys from environment variables. The abstraction allows swapping to HashiCorp Vault or AWS KMS without changing the encryption layer.

4. **Generated manifest, not hand-maintained** -- `python -m app.pii.manifest` scans all annotated models and produces `docs/pii_manifest.json`.

5. **Dev/test bypass** -- `pii_encryption_enabled=False` makes `EncryptedText` behave as plain `Text`, avoiding key management overhead in development.

## Consequences

### Positive
- Bank security questionnaires can be answered with a single JSON file
- GDPR Art. 30 records of processing generated from code, not maintained manually
- Encryption architecture is Vault-ready from day one
- Zero impact on existing queries -- `EncryptedText` is transparent to application code

### Negative
- JSONB fields containing PII arrays cannot use column-level `EncryptedText` -- require application-level encryption in Phase 2
- Dev/test bypass means plaintext in non-production databases

### Risks
- `info={}` metadata is not enforced by SQLAlchemy -- a developer could add a PII column without the annotation. Mitigated by CI drift detection in Phase 2.
- `EnvKeyProvider` stores the key in an env var which may appear in process listings. Production deployments should use `VaultKeyProvider`.
