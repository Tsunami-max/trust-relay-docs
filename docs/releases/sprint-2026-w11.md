---
title: "Sprint W11 — Mar 7–14, 2026"
sidebar_label: "W11 (Mar 7–14)"
---

# Sprint W11 Release Notes

**Period:** Saturday March 7 – Friday March 14, 2026
**Commits:** 347 (174 features, 92 fixes)
**Dev effort:** ~58h (1 architect + Claude Opus)

---

## Business Impact

The interface was rebuilt from the ground up to the quality standard of Stripe and Linear. Officers now work in a professional, distraction-free environment with a clear information hierarchy. The ability to correct company details mid-investigation — with the system automatically flagging that prior AI findings may need updating — closes a critical workflow gap that was forcing officers to abandon and restart cases.

## Key Deliverables

### Complete UI/UX Redesign
A new design system replaced the prototype interface: Surface components, CollapsiblePanel, semantic theme tokens, and the Inter typeface throughout. Dark, light, and system theme modes are available. The result is an interface officers can work in for hours without fatigue — and one that holds its own next to any enterprise SaaS product on the market.

### 4-Tab Case Detail Restructure
The case detail page was reorganised into four focused tabs — Overview, Evidence, Tasks, and History. Each tab surfaces exactly the information an officer needs at that stage of the investigation loop, reducing cognitive load and navigation time. The collapsible analytics panel keeps the primary workflow uncluttered.

### Entity Timeline Visualisation
A horizontal SVG timeline (with a vertical adaptive fallback) renders the sequence of events in an entity's lifecycle — incorporations, director changes, address moves, sanctions hits. Officers can see at a glance whether a company's history is consistent with its current risk profile, or whether the timeline tells a different story.

### Editable Company Details with Stale Banner
Officers can now correct company details discovered to be wrong during an investigation, using an inline Sheet component — no modal, no page reload. When details change, a stale investigation banner immediately flags that prior AI findings were based on different data and prompts a re-run, preserving investigation integrity.

## Metrics

| Metric | Value |
|--------|-------|
| Commits | 347 |
| Features shipped | 174 |
| Fixes | 92 |
| Dev effort | ~58h |
| Design system components introduced | New (Surface, CollapsiblePanel, tokens) |

## What We Learned

An officer's willingness to correct data mid-investigation is itself a signal — the stale banner pattern turns data correction from a liability (invalidating prior work invisibly) into a workflow feature (explicitly triggering a re-investigation with the corrected record).
