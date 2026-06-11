---
sidebar_position: 4
title: "The Documentation Commit Pattern"
description: "Every feature branch that changes architecture includes four"
---


Every feature branch that changes architecture includes four artifacts:

1. **Code changes** — the implementation itself
2. **ADR** (if applicable) — if a significant decision was made during implementation
3. **Docusaurus page update** — the relevant documentation page reflecting the new state
4. **Build verification** — `npm run build` in the Docusaurus directory confirms the documentation compiles without errors

This pattern is enforced during the review stage (Section 3.3). When a reviewer checks a feature branch, one of the review criteria is: "Does this branch update the relevant documentation?" Code changes without corresponding documentation updates are treated as incomplete — the same way code without tests is treated as incomplete.

The pattern is not burdensome in practice because the documentation update is usually small. Adding a new API endpoint requires adding a row to the API reference table. Adding a new service module requires updating the service inventory. Adding a new ADR requires creating a single file from the template. The effort is proportional to the change, and the payoff — accurate documentation that does not require a separate "catch up" effort — is immediate.

When documentation updates are genuinely unnecessary (bug fixes, configuration changes, internal refactoring that does not change external behavior), the reviewer confirms that no documentation update is needed rather than requiring a pro-forma change.

---
