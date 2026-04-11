---
id: 0029-cost-optimized-model-tiers
sidebar_position: 30
title: "ADR-0029: Cost-Optimized Model Tiers"
---

# ADR-0029: Cost-Optimized Model Tiers for Agent Fleet

**Date:** 2026-03-31 (date decision was originally made)
**Status:** Accepted
**Deciders:** Adrian Birlogeanu (Soft4U BV), Claude Code
**Documented retroactively:** 2026-04-03

## Context

Trust Relay runs 13+ PydanticAI agents per investigation, each performing a distinct task in the OSINT pipeline. These tasks have vastly different cognitive demands. The sanctions resolver must reason about partial name matches, transliterations, and alias networks to determine whether an entity matches a sanctioned party -- a task where false negatives have severe regulatory consequences. In contrast, the MCC classifier maps a company description to a standard industry code using a fixed lookup table, a task that requires pattern matching but minimal reasoning.

Using the most capable model (GPT-5.2) for every agent is wasteful. At estimated per-case costs, running GPT-5.2 across all 13 agents produces a per-investigation cost that scales linearly with case volume and becomes a significant operational expense. However, using the cheapest model everywhere risks missing critical compliance signals -- a budget model that misclassifies a sanctioned entity creates regulatory exposure that far outweighs the model cost savings.

The system needs a principled mapping from task criticality to model capability, with operational flexibility to change model assignments without code deployment.

## Decision

We implement a four-tier LLM hierarchy with centralized model selection:

### Tier Definitions

| Tier | Model | Use Case | Rationale |
|------|-------|----------|-----------|
| Premium | GPT-5.2 | sanctions_resolver, synthesis | Compliance-critical tasks where accuracy is paramount and false negatives have regulatory consequences |
| Mid | GPT-5.2 | adverse_media, scan_synthesis, case_intelligence | Analysis tasks requiring nuanced reasoning but with lower regulatory exposure than sanctions |
| Value | GPT-4.1-mini | registry_investigation, person_validation | Structured extraction from well-defined data sources (government registries, databases) |
| Budget | GPT-4.1-mini | task_generator, mcc_classifier, document_validator | Pattern matching and classification tasks with clear decision boundaries |

### Implementation

A centralized `get_model_for_agent(agent_name: str) -> str` function serves as the single point of model selection. This function consults a tier mapping dictionary and returns the appropriate model identifier. Environment variable overrides (`MODEL_TIER_PREMIUM`, `MODEL_TIER_MID`, `MODEL_TIER_VALUE`, `MODEL_TIER_BUDGET`) allow operations to change models at any tier without code changes, enabling rapid response to model availability issues, cost changes, or new model releases.

The tier assignment for each agent is based on two criteria:
1. **Regulatory consequence of error**: sanctions/PEP false negatives have severe consequences (Premium), adverse media misses are significant (Mid), registry extraction errors are recoverable (Value), classification errors are low-impact (Budget)
2. **Task cognitive complexity**: synthesis across multiple conflicting sources requires strong reasoning (Premium), structured extraction from APIs requires instruction following (Value)

## Consequences

### Positive
- Estimated 40-60% cost reduction per investigation compared to using Premium tier for all agents, while maintaining maximum accuracy on compliance-critical tasks
- Environment variable overrides enable model changes in production without code deployment -- critical for responding to model deprecation announcements or pricing changes
- Single `get_model_for_agent()` function provides a clear audit point for which model was used for each agent execution, supporting EU AI Act Article 11 documentation requirements
- Tier boundaries make the cost-quality tradeoff explicit and reviewable, rather than having ad-hoc model choices scattered across 13 agent files

### Negative
- Fixed tier assignments may not reflect the actual difficulty of a specific case -- a particularly complex registry extraction might benefit from a Premium model, but will always get Value tier
- Four tiers is a coarse granularity; some agents may be over-provisioned or under-provisioned relative to their actual needs
- Environment variable overrides affect all cases equally -- there is no mechanism to escalate model tier for high-risk cases

### Neutral
- Model tier selection is logged alongside prompt version (see ADR-0026) in the agent execution audit trail
- Tier assignments are reviewed quarterly as part of cost optimization and quality assurance cycles
- New agents added to the pipeline must be explicitly assigned a tier -- there is no default, forcing a conscious decision about model requirements

## Alternatives Considered

### Alternative 1: Single Model for All Agents
- Why rejected: Either all agents use the most expensive model (GPT-5.2 x 13 agents = high per-case cost that scales linearly with volume) or all agents use a cheaper model (unacceptable accuracy risk on sanctions resolution and synthesis, where false negatives have regulatory consequences). A one-size-fits-all approach cannot balance cost and quality across tasks with fundamentally different cognitive demands.

### Alternative 2: Per-Agent Hardcoded Model Strings
- Why rejected: Scattering model identifiers across 13 agent files creates configuration fragmentation. Operations cannot see or change the model allocation without reading every agent file. A model deprecation announcement requires modifying 13 files, testing each, and redeploying -- versus changing one environment variable with the tiered approach.

### Alternative 3: Dynamic Model Selection Based on Case Complexity
- Why rejected: Determining case complexity before running the agents requires a pre-analysis step, which itself consumes model inference time and cost. The complexity assessment must happen before the investigation starts (to select models), but meaningful complexity can only be determined after investigation begins (a circular dependency). Fixed tiers based on task type are simpler, predictable, and avoid this bootstrapping problem.
