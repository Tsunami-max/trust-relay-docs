---
sidebar_position: 2
title: "Model Selection"
description: "**What:** Different agent tasks require different model capabilities."
---


**What:** Different agent tasks require different model capabilities. The methodology uses a tiered model selection approach that matches model capability to task requirements, optimizing for the right tradeoff between judgment quality, speed, and cost.

**Why:** Using the most capable model for every task is wasteful — a mechanical checklist review does not benefit from the same depth of reasoning that a security assessment requires. Conversely, using a fast model for a task that requires regulatory judgment or architectural reasoning produces superficial results that miss critical issues. The model selection rationale formalizes this tradeoff so that it is applied consistently rather than by ad-hoc intuition.

**Model Selection Rationale:**

| Task Type | Model | Rationale |
|---|---|---|
| Security review, compliance review, architecture design | Opus | Requires judgment, nuanced context evaluation, regulatory knowledge. False negatives (missed vulnerabilities, compliance gaps) are costly. The quality premium justifies the cost. |
| API review, migration review, mechanical implementation | Sonnet | Pattern matching against checklists, structural verification. The task is well-defined and the correct answer is deterministic. Speed matters more than depth. |
| Simple searches, file lookups, formatting tasks | Haiku | Speed over depth. The task has a clear correct answer that does not require reasoning. |

**How this maps to the agent definitions:**

Each agent definition includes a `model` field in its frontmatter that specifies the default model:

```yaml
---
name: security-reviewer
model: opus
tools: Read, Grep, Glob
---
```

```yaml
---
name: api-reviewer
model: sonnet
tools: Read, Grep, Glob
---
```

The model selection is a default, not a constraint. If a nominally mechanical task turns out to require more reasoning (an API review uncovers a complex authorization pattern), the orchestrator can re-dispatch with a more capable model.

**Evidence:** Trust Relay's 4 project reviewer agents use model selection based on this rationale: the security reviewer and compliance reviewer use Opus (judgment-intensive, high cost of false negatives), while the API reviewer and migration reviewer use Sonnet (checklist-based, deterministic). This allocation reflects the actual risk profile — a missed security vulnerability or compliance gap has regulatory consequences, while an API naming inconsistency does not. See [appendix-c-agents.md](../appendix-c-agents) for the full agent definitions.

**Capability-based tool prescription.** The methodology prescribes tools by capability threshold, not by model name. Model names change quarterly; capability thresholds are durable.

| Capability | If Yes | If No |
|-----------|--------|-------|
| Context > 200K tokens | Read files directly | Use Serena for symbol navigation |
| Internal reasoning | No external reasoning tool needed | Use Sequential Thinking MCP |
| Reliable multi-step execution | Direct tool use | Skill-guided execution (Superpowers) |

Tools are also prescribed per development phase — brainstorming needs no code tools, implementation needs LSP and navigation, review needs multi-agent review plugins. See [appendix-i-tool-selection.md](../appendix-i-tool-selection) for the complete decision matrix.

---
