---
sidebar_position: 0
title: "UI/UX Standard (Summary)"
description: "The UI/UX standard establishes prescriptive rules for interface quality."
---


The UI/UX standard establishes prescriptive rules for interface quality. It is not a style guide — it is an engineering specification that defines what components to use, what patterns are forbidden, and what accessibility thresholds must be met.

**Design System:** shadcn/ui is the required design system for all React applications. Components are added via `npx shadcn@latest add <component>`, not installed as a direct dependency. Building custom components when a shadcn/ui equivalent exists is forbidden.

**Prescriptive Rules:**

- **Skeleton loaders** for all async content (not spinners). Use the shadcn/ui `Skeleton` component. Full-page loading spinners are forbidden.
- **Toast notifications** via Sonner for all async feedback. `alert()` boxes, `confirm()` dialogs, and native browser notifications are forbidden.
- **Inline confirmation** for destructive actions (not modal dialogs). Modals are reserved for complex multi-step flows that cannot be accomplished inline.
- **WCAG AA color contrast** (4.5:1 minimum ratio). Every color combination must meet this threshold.
- **44px minimum touch targets** on mobile. Interactive elements smaller than this are inaccessible on touch devices.
- **Responsive breakpoints:** 320px (mobile), 768px (tablet), 1024px+ (desktop).

**Forbidden Patterns:**

| Pattern | Replacement |
|---|---|
| Native `alert()` / `confirm()` dialogs | Sonner toast + inline confirmation |
| Full-page loading spinners | Skeleton loaders |
| Modal dialogs for simple confirmations | Inline UI or Sheet component |
| Click/touch targets smaller than 44px | Minimum 44px interactive area |
| Building custom components when shadcn/ui has an equivalent | Use the shadcn/ui component |

**Reference Designs** (quality bar): Linear (keyboard-first), Stripe Dashboard (enterprise quality), Vercel Dashboard (modern responsive), Notion (rich interactions, empty states).

**Evidence:** Trust Relay's 74,836-line frontend codebase uses shadcn/ui exclusively, with Sonner for toast notifications, skeleton loaders for all async content, and WCAG AA-validated branding. See [appendix-f-evidence.md](../appendix-f-evidence) for the frontend metrics.

Full specification: [appendix-b-uiux.md](../appendix-b-uiux)

---
