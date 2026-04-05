---
sidebar_position: 11
title: "UI Design System"
last_verified: 2026-03-29
status: implemented
---

# UI Design System

The frontend follows a cohesive dark-theme design language inspired by Stripe Dashboard and Linear, built on shadcn/ui components with Tailwind CSS v4.

## Design Principles

1. **Information density** -- Compliance officers need to see a lot of data at once. The dashboard uses a single-page layout with tabbed sections rather than multi-page navigation.
2. **Visual hierarchy through color** -- Risk levels, agent statuses, and case states all use consistent color scales.
3. **Data-first** -- Tables, charts, and structured data displays take priority over decorative elements.
4. **Branded portal** -- The customer-facing portal uses a separate light theme with configurable branding.

## Component Library: shadcn/ui

shadcn/ui components are installed via CLI, not imported as a package dependency:

```bash
npx shadcn@latest add button card table tabs
```

This approach means:
- Components live in `src/components/ui/` as local source files
- Full control over styling and behavior
- No version lock to a component library release cycle
- Tailwind CSS is the only styling dependency

### Installed Components (25)

| Category | Components |
|----------|-----------|
| Layout | card, separator, sheet, collapsible |
| Input | button, checkbox, input, label, select, textarea, toggle, toggle-group |
| Data Display | badge, table, progress, skeleton, tooltip |
| Navigation | tabs, command, popover |
| Feedback | dialog, sonner (toast) |

### Custom Components (3)

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Frosted glass card effect with backdrop blur, used for dashboard stat cards |
| `JsonViewer` | Wrapper around `@uiw/react-json-view` with custom dark theme colors |
| `ParticleBackground` | Animated particle effect using canvas, used on the portal landing page |

## Color System

### Dashboard (Dark Theme)

| Purpose | Color | Tailwind Class |
|---------|-------|---------------|
| Primary accent | Teal | `text-teal-400`, `bg-teal-500/10`, `border-teal-500/30` |
| Background | Slate 950 | `bg-slate-950` |
| Card background | Slate 900/800 | `bg-slate-900`, `bg-slate-800/50` |
| Text primary | White/Slate 100 | `text-white`, `text-slate-100` |
| Text secondary | Slate 400 | `text-slate-400` |
| Borders | Slate 700 | `border-slate-700` |

### Risk Severity Scale

| Severity | Color | Usage |
|----------|-------|-------|
| Verified/Clean | Emerald | `text-emerald-400`, `bg-emerald-500/10` |
| Low | Blue | `text-blue-400`, `bg-blue-500/10` |
| Medium | Amber | `text-amber-400`, `bg-amber-500/10` |
| High | Orange | `text-orange-400`, `bg-orange-500/10` |
| Critical | Red | `text-red-400`, `bg-red-500/10` |

### Case Status Colors

| Status | Color |
|--------|-------|
| Approved | Emerald |
| Review Pending | Amber |
| Processing / Awaiting | Blue |
| Rejected | Red |
| Escalated | Purple |
| Failed | Red/Gray |

### Agent Pipeline Status

| Status | Color | Meaning |
|--------|-------|---------|
| Success | Emerald | Agent completed successfully |
| Running | Blue (animated) | Agent currently executing |
| Failed | Red | Agent encountered an error |
| Reused | Amber | Cached result from prior iteration |
| Pending | Slate | Agent queued, not yet started |

## Portal Theme (Light Mode)

The customer-facing portal uses a light theme to differentiate the experience:

| Purpose | Color | Notes |
|---------|-------|-------|
| Background | White | Clean, professional appearance |
| Primary | Brand-configurable | Defaults to `#2563EB` (blue) |
| Brand logo | Configurable URL | Displayed in `BrandedHeader` component |
| Brand name | Configurable text | Defaults to "Trust Relay" |

Portal branding is configured per deployment:

```python
# backend/app/config.py
brand_name: str = "Trust Relay"
brand_primary_color: str = "#2563EB"
brand_logo_url: str = ""
```

## Data Visualization

### JSON Data Display

The `JsonViewer` component renders structured data (evidence, API responses) with syntax highlighting:

```typescript
// Custom dark theme colors
const theme = {
  string: "teal",      // #2dd4bf
  number: "amber",     // #fbbf24
  boolean: "emerald",  // #34d399
  key: "slate",        // #94a3b8
  background: "transparent",
};
```

### Charts (Recharts)

- **FinancialHealthCard** -- Trend sparklines for revenue, assets, equity over time
- **AnalyticsCharts** -- Risk distribution bar chart, case status pie chart
- **RiskHeatmap** -- Aggregated risk visualization across all cases
- **ConfidenceChart** -- Radial confidence score display
- **RiskScoreRing** -- SVG ring showing 0.0-1.0 risk score with color gradient

### Pipeline Visualization

- **PipelineDAG** -- Directed acyclic graph showing agent dependencies
- **AgentCard** -- Individual agent status card with model name, duration, findings count
- **PipelineTimingBar** -- Horizontal bar chart showing relative agent execution times

## Accessibility

### What Is In Place

- **Touch targets** -- Buttons follow the 44px minimum touch target rule
- **Color contrast** -- Primary text on dark backgrounds meets WCAG AA (4.5:1 ratio)
- **ARIA labels** -- Present on interactive elements in shadcn/ui primitives
- **Skeleton loaders** -- Used instead of spinners for content loading states
- **Toast notifications** -- Sonner toasts for async feedback instead of alert boxes

### Known Gaps

- **Keyboard navigation** -- Some custom components (PipelineDAG, RiskHeatmap) lack keyboard support
- **Screen reader** -- Complex data visualizations (charts, JSON viewer) have limited screen reader descriptions
- **Focus management** -- Tab panel focus behavior is inconsistent
- **Color-only indicators** -- Some status indicators rely on color alone without text or icon alternatives

:::note
Accessibility improvements are tracked as a production readiness item. The current implementation handles the common paths but has gaps in complex interactive components.
:::

## Responsive Design

The dashboard is designed for desktop-first (officer workstations) with basic tablet support:

| Breakpoint | Layout |
|-----------|--------|
| 320px (mobile) | Single column, basic support |
| 768px (tablet) | Two-column layout |
| 1024px+ (desktop) | Full dashboard layout with sidebar and tabs |

The customer portal is fully responsive across all breakpoints, as customers may access it from mobile devices.

## Golden Standard UI Rules

The following rules from the project's Golden Standard v6 are enforced:

- shadcn/ui as the component library (not Material UI, not Ant Design)
- Skeleton loaders for content loading (not spinners)
- Sonner toasts for async feedback (not alert boxes)
- No modal dialogs for simple confirmations -- use inline UI or Sheet
- Minimum 44px touch targets
- WCAG AA color contrast (4.5:1)
- Design reference: Stripe Dashboard / Linear
