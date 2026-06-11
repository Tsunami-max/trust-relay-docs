---
sidebar_position: 43
title: "Evidence & Trust Capsule"
description: "Evidence collection, bundling, Merkle-anchored trust capsules, and guarantee validation"
components:
  - app/services/trust_capsule_service.py
  - app/services/evidence_bundle_service.py
  - app/services/evidence_service.py
  - app/services/guarantee_validator.py
last_verified: 2026-06-11
status: implemented
---

# Evidence & Trust Capsule

Evidence management and trust capsule services providing tamper-evident evidence collection, structured bundling with provenance tracking, Merkle-tree-anchored trust capsule generation for regulatory audit, and financial guarantee validation. Every AI-driven decision is backed by a traceable evidence chain.

## Components

| Module | Purpose |
|--------|---------|
| `trust_capsule_service.py` | Merkle-tree-anchored compliance evidence capsules sealed as a ZIP (ADR-0017) |
| `evidence_bundle_service.py` | PydanticAI chain-of-thought evidence bundling with source provenance (ADR-0021) |
| `evidence_service.py` | SHA-256 evidence hashing + MinIO bundle storage (PEPPOL verifications) |
| `guarantee_validator.py` | LLM extraction of customs/VAT financial guarantees + VoP cross-reference |

## Trust Capsule (ADR-0017)

`TrustCapsuleService.assemble(case_id, tenant_id)` collects every compliance artefact for a case (case data, audit events, signal/domain events, decision) and seals them into a cryptographically anchored ZIP bundle. The pipeline:

1. **Collect artefacts** from the database via `_fetch_case_data` and `_build_artifacts`
2. **Build a binary Merkle tree** (`build_merkle_tree`) over the per-artefact SHA-256 leaf hashes (`compute_leaf_hash` → `sha256:<hex>` over canonical JSON); the `merkle_root` anchors the whole capsule
3. **Render a PDF** via WeasyPrint + Jinja2 templates (`_render_capsule_pdf`)
4. **Sign the PDF (optional)** with a PAdES-B-T signature via `pyhanko` (`_sign_pdf_pades`)
5. **Timestamp (optional)** with an RFC 3161 token via `rfc3161ng` against `capsule_tsa_url` (default `https://freetsa.org/tsr`)
6. **Create the ZIP** containing the PDF and a machine-readable `manifest.json`
7. **Persist** to MinIO (`{case_id}/trust-capsule/{capsule_id}.zip`) and the database

`verify(capsule_zip)` re-extracts `manifest.json`, rebuilds the Merkle tree from the artefact hashes, and compares the computed root against the manifest's `merkle_root`. `download(capsule_id)` retrieves the sealed ZIP from MinIO.

:::note Signing and timestamping degrade gracefully
PAdES signing and RFC 3161 timestamping are **best-effort**: if `pyhanko` / `rfc3161ng` are not installed, or the signing cert/key (`capsule_signing_cert` / `capsule_signing_key`) are absent, the capsule is still produced **without** a digital signature or timestamp (logged as a warning, non-fatal). The Merkle root provides per-artefact tamper *evidence* regardless, but a capsule is not guaranteed to carry a cryptographic signature unless the certs are configured. `verify()` checks the Merkle root only; it does not currently perform full PAdES signature validation (`signature_valid` is returned as `None`).
:::

## Evidence Bundle (ADR-0021)

`EvidenceBundleService.build_bundle(...)` captures the full PydanticAI agent chain-of-thought (`all_messages()`) for an AI operation — request/response metadata, model identification, and the reasoning chain — into an `EvidenceBundle`. Bundles are stored in and loaded from MinIO (`store_bundle` / `load_bundle` / `list_bundles`). This is the EU AI Act Art. 12 logging artefact for AI-driven findings.

## Guarantee Validator

`GuaranteeValidator.validate(markdown_content, case_context)` uses a PydanticAI LLM agent (prompt template `customs_guarantee_extraction` from the `PromptRegistry`) to extract structured `FinancialGuarantee` data from a customs/VAT guarantee document, then cross-references the guarantor bank against Verification-of-Payee (VoP) results in the case context using `rapidfuzz` (match threshold 80). This is a fiscal-representation feature, not a generic "guarantee validation against collected evidence" engine.

## ADRs

- ADR-0017: Trust Capsule Cryptographic Architecture (`docs/adr/ADR-0017-trust-capsule-cryptographic-architecture.md`)
- ADR-0021: Evidence Bundle System for EU AI Act Chain-of-Thought Capture (`docs/adr/ADR-0021-evidence-bundle-system-eu-ai-act-audit-trail.md`)
