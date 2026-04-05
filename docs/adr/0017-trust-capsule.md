---
id: 0017-trust-capsule
sidebar_position: 18
title: "ADR-0017: Trust Capsule Cryptographic Architecture"
---

# ADR-0017: Trust Capsule Cryptographic Architecture

| | |
|---|---|
| **Date** | 2026-03-19 |
| **Status** | `Accepted` |
| **Deciders** | Adrian Birlogeanu |
| **Context** | DHL/Gerlach customs pitch -- tamper-evident compliance evidence packages |

## Decision

Seal completed compliance cases as **Trust Capsules** using three-layer cryptographic architecture:

1. **Merkle tree (SHA-256)** -- content integrity
2. **PAdES-B-T** (PDF Advanced Electronic Signatures) -- document authenticity
3. **RFC 3161** -- temporal proof (trusted timestamp)

## Context

TrustRelay needs a tamper-evident, independently verifiable evidence package for completed compliance cases. This is the core differentiator for the DHL/Gerlach customs pitch -- no competitor produces a single document proving entity identity + sanctions clearance + bank verification + policy evaluation with cryptographic proof.

### Regulatory Requirements

| Regulation | Requirement | How Trust Capsule Addresses It |
|---|---|---|
| EU AI Act Art. 12 | Automatic logging of all AI operations | All AI inputs, outputs, model IDs, and prompt template versions captured in capsule manifest |
| GDPR Art. 30 | Records of processing activities | Capsule manifest records what data was processed, by which model, at what time |
| AML 6AMLD / AMLR | 5-year minimum retention for all KYB/KYC records | Capsule is a self-contained archive; RFC 3161 timestamp proves it predates any future tamper |

## Three-Layer Architecture

### Layer 1: Merkle Tree (SHA-256) -- Content Integrity

Each artifact in the capsule (OSINT report, Docling Markdown, officer decision, audit log, AI reasoning chain, risk score) is hashed individually. A binary Merkle tree over all artifact hashes produces a **root hash** embedded in the capsule manifest.

**Key property:** Per-artifact Merkle proofs enable verifying a single artifact without downloading the entire capsule. Proof size is O(log n) -- approximately 200 bytes per artifact for a 32-artifact capsule.

### Layer 2: PAdES-B-T -- Document Authenticity

The capsule manifest PDF is signed using PDF Advanced Electronic Signatures (ETSI EN 319 132-1), producing a `.pdf` with an embedded signature and certificate chain.

| Environment | Certificate |
|---|---|
| PoC | Self-signed RSA 2048, generated at deploy time |
| Production | eIDAS qualified certificate from Belgian CA (Certipost / GlobalSign BE) |

PAdES-B-T includes an embedded RFC 3161 timestamp in the signature itself, binding the signing time cryptographically.

### Layer 3: RFC 3161 -- Temporal Proof

After PDF sealing, the capsule is submitted to a Trusted Timestamp Authority (TSA). The TSA returns a signed timestamp token that proves the capsule existed at a specific instant.

| Environment | TSA |
|---|---|
| PoC | FreeTSA.org (free, publicly trusted) |
| Production | Qualified TSA (e.g., Certipost, DigiCert) per eIDAS Regulation Art. 42 |

The timestamp token is stored alongside the capsule in MinIO and embedded in the manifest.

## Libraries

| Library | License | Purpose |
|---|---|---|
| `pyhanko` | MIT | PAdES-B-T signing, PDF manipulation |
| `rfc3161ng` | MIT | RFC 3161 timestamp request/response |
| `hashlib` | stdlib | SHA-256 Merkle hashing |

No GPL or copyleft dependencies introduced.

## Consequences

### Benefits

- Trust Capsules are **independently verifiable without TrustRelay access** -- a customs auditor or court can verify a capsule using only open-source tools and the TSA's public certificate
- **Three distinct failure modes** (content tamper -> Merkle mismatch; signature invalid -> PAdES verification fails; timestamp invalid -> RFC 3161 token fails) provide defense-in-depth -- an attacker must defeat all three layers independently
- **Per-artifact Merkle proofs** allow selective disclosure: share a single document with its proof path without revealing the rest of the capsule
- **Self-contained archive**: capsule + proofs stored in MinIO under `{case_id}/trust-capsule/`; no runtime dependency on TrustRelay to verify

### Limitations

- Self-signed certificate is **not legally binding** under eIDAS -- sufficient for PoC demo, production requires qualified certificate upgrade
- FreeTSA.org is **not a qualified TSA** under eIDAS Art. 42 -- production requires a commercial qualified TSA subscription
- Merkle proofs add ~200 bytes per artifact (negligible for compliance documents)
- `pyhanko` requires a PDF as the signing target -- non-PDF artifacts (Markdown, JSON) are included via Merkle hash only, not directly embedded in the PAdES signature

## Alternatives Considered

### Simple SHA-256 of entire document
Rejected. Provides content integrity only -- no per-artifact verification, no temporal proof, no document authenticity. A corrupt actor could reconstruct a matching hash by replacing the entire capsule.

### JWS/JWT signing
Rejected. Not PDF-native, no standard timestamp integration, poor tooling for long-term verification (key rotation invalidates old signatures). JWTs are designed for short-lived authentication, not 5-year compliance archives.

### Blockchain anchoring
Rejected. Over-engineered for this use case, adds a runtime dependency on a blockchain network, introduces operational and legal uncertainty (which jurisdiction governs an Ethereum transaction?). RFC 3161 from a qualified TSA has identical temporal proof properties with established legal recognition under eIDAS.
