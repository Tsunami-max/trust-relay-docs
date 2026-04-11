---
id: 0031-regulatory-segments
sidebar_position: 32
title: "ADR-0031: Regulatory Segment Profiles"
---

# ADR-0031: Regulatory Segment Profiles with Declarative YAML Compiler

**Status:** Accepted
**Date:** 2026-04-06

## Context

Trust Relay serves multiple verticals (banking, customs brokers, precious metals dealers, payment service providers) across multiple EU countries. Each vertical+country combination has different regulatory obligations, different risk calibrations, and different document requirements. A banking KYB in Belgium operates under different regulations than a customs broker KYB in Czech Republic, yet both flow through the same investigation pipeline.

Without a formal abstraction, this variability was handled through scattered conditionals in agent prompts, risk scoring, and document templates. Adding a new vertical or country required changes across multiple services, with no single source of truth for "what does this type of investigation require?" The system needed a declarative way to define investigation profiles that could be compiled at case creation time and frozen for audit purposes.

Additionally, the EU AI Act (Art. 11) requires that the system document which regulations drove each AI decision. A compiled segment profile -- with its regulatory basis table -- provides this traceability by linking each pipeline task to the specific regulation and article that mandates it.

## Decision

Implement a declarative segment profile system with three components:

1. **YAML segment profiles** (`config/segments/*.yaml`) -- each file defines a vertical+country combination with its regulations, agent configurations, risk calibration weights, EVOI cost parameters, and document resolution strategy. Currently 8 profiles: `default`, `default_banking`, `default_customs`, `default_hvg`, `default_professional`, `default_psp`, `be_precious_metals`, `cz_banking_kyb`.

2. **Segment compiler** (`segment_compiler.py`) -- at case creation time, resolves the best-matching profile for the case's vertical+country, resolves regulation references against the Lex corpus (ADR-0016), and produces a frozen `CompiledSegmentProfile`. The compiled profile includes SHA-256 hashes of both the input YAML and the compiled output, ensuring tamper detection and audit reproducibility.

3. **Frozen compiled profile** -- stored with the case as an immutable snapshot. All downstream pipeline components (agent model tiers, risk matrix weights, document gap analyzer) read from the compiled profile rather than the YAML files directly. This means a profile change after compilation does not retroactively affect running investigations.

The compiler version is tracked (`COMPILER_VERSION = "1.0.0"`) so that recompilation with a newer compiler can be detected and audited.

## Consequences

### Positive
- Adding a new vertical or country is a single YAML file -- no code changes to the pipeline
- Regulatory basis table provides Art. 11 traceability from each agent task to its legal mandate
- SHA-256 hashing guarantees that the profile used for a case is immutable and verifiable
- Risk calibration weights per segment enable proportionate scrutiny (correspondent banking vs. retail)
- EVOI cost parameters per segment reflect that false negatives in banking have different costs than in customs

### Negative
- Profile resolution logic (matching vertical+country to the best YAML) adds complexity to case creation
- 8 YAML files already -- could proliferate as countries and verticals multiply (potentially 100+ combinations)
- Lex corpus resolution at compile time creates a dependency on the Lex service being available during case creation

### Risks
- Stale YAML profiles -- if regulations change but profiles are not updated, new cases compile against outdated obligations
- Compiler version drift -- changing the compiler without incrementing the version could make old and new profiles incomparable
