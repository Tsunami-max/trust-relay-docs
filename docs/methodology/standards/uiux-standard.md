---
sidebar_position: 2
title: "UI/UX Standard"
description: "Prescriptive UI/UX rules: shadcn/ui design system, Sonner toasts, skeleton loaders, WCAG AA accessibility, and responsive design targets"
---

# UI/UX Standard

This appendix specifies the UI/UX standards for all frontend applications built under the S4U Development Methodology. These are standards, not suggestions. Every rule includes a rationale so that engineers understand the failure mode each rule prevents. Compliance is verified during code review.

This standard was distilled from the Golden Standard v6 UI/UX Excellence section, hardened through 74,836 lines of production TypeScript/TSX across 304 files in the Trust Relay compliance platform, and refined based on real user feedback from compliance officer and customer-facing portal interfaces.

---

## 1. Design System: shadcn/ui

**Standard:** All projects use [shadcn/ui](https://ui.shadcn.com/) as the prescriptive design system. This is not a recommendation among alternatives — it is the standard.

**Installation pattern:**

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add table
# Add components individually as needed
```

shadcn/ui is **not** installed as a direct dependency in `package.json`. Components are scaffolded into `src/components/ui/` as source files that you own and can modify.

**Why shadcn/ui over alternatives:**

| Property | shadcn/ui | Material UI | Chakra UI | Radix UI (raw) |
|---|---|---|---|---|
| Ownership | Source code in your repo | Dependency you cannot modify | Dependency you cannot modify | Primitives only, no styling |
| Styling | Tailwind CSS native | CSS-in-JS (Emotion) | CSS-in-JS (Emotion) | BYO styling |
| Accessibility | Built on Radix primitives (WCAG AA) | Built-in | Built-in | Built-in (unstyled) |
| Bundle size | Zero — components are source code | 300KB+ (tree-shakeable) | 200KB+ | Minimal |
| Customization | Full control — edit the source | Theme overrides, limited | Theme overrides | Full control |
| Tailwind alignment | Native | Friction | Friction | Compatible |

**Forbidden:** Building custom UI primitives (buttons, inputs, selects, dialogs, tables, cards, tooltips, popovers) when a shadcn/ui component exists.

**Required companion libraries:**

| Library | Purpose |
|---|---|
| Tailwind CSS v4 | Utility-first CSS framework; shadcn/ui's styling layer |
| `class-variance-authority` (CVA) | Component variant management (installed with shadcn/ui) |
| `clsx` + `tailwind-merge` | Conditional class composition (installed with shadcn/ui) |
| `lucide-react` | Icon library (consistent with shadcn/ui defaults) |

---

## 2. Toast Notifications: Sonner

**Standard:** All transient user feedback (success confirmations, error notifications, async operation results) uses [Sonner](https://sonner.emilkowal.dev/) toast notifications. No exceptions.

**Installation:**

```bash
npx shadcn@latest add sonner
```

**Usage pattern:**

```tsx
import { toast } from "sonner"

// Success
toast.success("Case approved successfully")

// Error
toast.error("Failed to upload document. Please try again.")

// Promise-based (shows loading -> success/error automatically)
toast.promise(submitDecision(caseId, decision), {
  loading: "Submitting decision...",
  success: "Decision recorded",
  error: "Failed to submit decision",
})

// Action toast (with undo or follow-up)
toast("Document deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreDocument(docId),
  },
})
```

**Forbidden:**
- `window.alert()` — blocks the thread, breaks the experience
- `window.confirm()` — see Section 9 (Forbidden Patterns)
- Custom notification systems — unless Sonner cannot handle the specific use case

---

## 3. Visual Quality Checklist

Every component, page, and feature must pass this checklist before merge.

### 3.1 Spacing

- All spacing uses the design system's scale (Tailwind: `p-2`, `p-4`, `p-6`, `gap-4`, `space-y-4`, etc.)
- No hardcoded pixel values for spacing
- Consistent spacing between related elements
- Adequate whitespace around content blocks

### 3.2 Typography

- Headings follow a clear hierarchy (`h1` > `h2` > `h3`, with visible size differentiation)
- Body text uses the design system's default size
- Line height is appropriate for readability
- Font weight distinguishes labels from values
- No more than 2-3 font sizes per view

### 3.3 Color Contrast

- Text-to-background contrast meets WCAG AA minimum: **4.5:1** for normal text, **3:1** for large text
- Interactive elements are visually distinct from static content
- Status indicators use semantic colors consistently
- Color is never the sole differentiator — always pair with icons, text, or shape

### 3.4 Loading States

- Every async operation has a visible loading state
- Content areas use skeleton loaders (see Section 7)
- Action buttons show a loading spinner and are disabled during submission
- Loading states match the layout of the loaded content (no layout shift)

### 3.5 Empty States

- Every list, table, and data view has a designed empty state
- Empty states include: an illustration or icon, a descriptive message, and (where applicable) a call-to-action
- First-use empty states are distinct from filtered-to-zero empty states

### 3.6 Error States

- Error messages are written for users, not developers
- Error states suggest a recovery action where possible
- Form validation errors appear inline next to the relevant field
- Errors are visually distinct but not alarming

---

## 4. Interaction Quality Checklist

### 4.1 Hover and Focus States

- Every interactive element has a visible hover state
- Every focusable element has a visible focus ring (`focus-visible:ring-2 focus-visible:ring-ring`)
- Focus rings are not suppressed — never use `outline-none` without a replacement focus indicator

### 4.2 Form Validation

- Validation errors appear on field blur (not on every keystroke, not only on submit)
- Errors display inline, directly below the field
- Invalid fields have a visible border color change
- Required fields are marked (asterisk or "Required" label)

### 4.3 Loading Buttons

- Buttons that trigger async operations show a spinner icon during the operation
- Loading buttons are disabled to prevent double-submission
- Button width does not change when text changes

### 4.4 Keyboard Navigation

- All interactive elements are reachable via Tab key in a logical order
- Dialogs trap focus (Tab does not escape the dialog)
- Escape closes the topmost overlay
- Enter activates the focused button or submits the focused form
- Arrow keys navigate within composite widgets

### 4.5 Skeleton Loaders

- Content areas display skeleton placeholders while data is loading
- Skeleton shapes approximate the final content layout
- Skeletons animate with a subtle shimmer (`animate-pulse`)
- Skeletons are replaced by content without layout shift

---

## 5. Responsive Design Targets

### Breakpoints

| Breakpoint | Width | Target devices | Layout expectations |
|---|---|---|---|
| Mobile | 320px minimum | Phones | Single column, stacked layout, hamburger menu |
| Tablet | 768px | Tablets, small laptops | Two columns where appropriate, collapsible sidebar |
| Desktop | 1024px+ | Laptops, monitors | Full layout with sidebar, multi-column content |

### Touch Targets

- All interactive elements have a minimum touch target of **44x44 pixels** on mobile viewports
- Adjacent touch targets have adequate spacing (minimum 8px gap)
- If a visual element is smaller than 44px, the clickable area must still be 44x44px (use padding)

### Responsive Implementation Rules

- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) — never CSS media queries in component styles
- Test at 320px, 768px, and 1024px during development
- Navigation collapses to hamburger menu at mobile breakpoint
- Data tables become scrollable or switch to card layout on mobile
- Forms remain single-column on mobile

---

## 6. Accessibility Checklist (WCAG AA)

### 6.1 Color Contrast

- Normal text (< 18px): minimum **4.5:1** contrast ratio
- Large text (>= 18px or >= 14px bold): minimum **3:1** contrast ratio
- UI components and graphical objects: minimum **3:1** against adjacent colors

### 6.2 Images and Icons

- Informational images have descriptive `alt` text
- Decorative images use `alt=""` (empty alt, not missing alt)
- Icon-only buttons have `aria-label` or visually hidden text

### 6.3 Forms

- Every input has a visible `<label>` associated via `htmlFor`/`id`
- Required fields are indicated both visually and programmatically (`aria-required="true"`)
- Error messages are associated with fields via `aria-describedby`
- Form groups use `<fieldset>` and `<legend>` where appropriate

### 6.4 ARIA Attributes

- Custom interactive components use appropriate ARIA roles
- Dynamic content updates use `aria-live` regions
- Expandable sections use `aria-expanded` state
- Tab interfaces use `role="tablist"`, `role="tab"`, `role="tabpanel"`

:::tip Semantic HTML First
Prefer semantic HTML over ARIA. A `<button>` is always better than `<div role="button">`. ARIA is for cases where semantic HTML does not provide the needed semantics.
:::

### 6.5 Focus Management

- Focus is moved to newly opened dialogs
- Focus returns to the trigger element when a dialog closes
- Skip-to-content link exists for pages with navigation
- No focus traps outside of modal dialogs

---

## 7. Modern Patterns (Required)

### 7.1 Skeleton Loaders (Not Spinners)

**Standard:** Content loading states use skeleton placeholders that match the shape of the expected content. Spinners are forbidden for content loading.

```tsx
// CORRECT: Skeleton loader
function CaseListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Why skeleton loaders over spinners:**

1. **Perceived performance.** Skeleton loaders make the application feel faster because they show the page structure immediately.
2. **No layout shift.** Skeleton loaders occupy the exact space the content will fill.
3. **Reduced anxiety.** A skeleton screen communicates "content is coming, here is where it will appear."

**Exception:** Spinners are appropriate for action-in-progress indicators inside buttons.

### 7.2 Command Palette

Applications with more than 10 distinct actions or views should implement a command palette accessible via `Cmd+K` / `Ctrl+K`.

```bash
npx shadcn@latest add command
```

### 7.3 Optimistic Updates

For operations where success is the overwhelmingly likely outcome, update the UI immediately and reconcile with the server response.

**When NOT to use:** Do not use optimistic updates for irreversible or high-consequence operations (approve/reject decisions, document deletion, financial transactions).

### 7.4 Inline Confirmations

Destructive actions use inline confirmation patterns, not modal dialogs.

```tsx
function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Delete?</span>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Yes
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          No
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
```

### 7.5 Smooth Transitions

State transitions use CSS transitions in the 150-300ms range with `ease-out` timing:

- **150ms** for micro-interactions (hover effects, toggle states)
- **200ms** for component transitions (accordion expand, dropdown open)
- **300ms** for page-level transitions (sheet slide-in, dialog fade-in)

---

## 8. Reference Designs

These applications set the aesthetic and interaction quality bar:

### Stripe Dashboard
Information density without clutter. Data tables that present complex data clearly. Navigation that scales.

### Linear
Speed. Every interaction feels instant. Keyboard-first design. Command palette that indexes everything.

### Vercel Dashboard
Modern minimalism. Excellent use of whitespace. Real-time status indicators. Genuinely good mobile experience.

### Notion
Rich interactions that remain intuitive. Exceptional empty states. Gradual disclosure.

---

## 9. Forbidden Patterns

| Pattern | Why Forbidden | Use Instead |
|---|---|---|
| Modal dialogs for simple confirmations | Break flow, steal focus | Inline confirmation or toast with undo |
| Full-page loaders | Destroy perceived performance | Skeleton loaders for content areas |
| Native `alert()` / `confirm()` / `prompt()` | Modal, unstyled, inaccessible | Toast + inline confirmation + form fields |
| Spinners for content loading | No structural preview, cause layout shift | Skeleton loaders |
| Touch targets < 44px | Cause mis-taps, accessibility violation | 44px minimum interactive area |
| Unstyled error pages | Erode user confidence | Designed error states with recovery guidance |
| Horizontal scroll on mobile | Users do not expect horizontal scrolling | Responsive layout or scroll container for tables |

---

## 10. Component Selection Guide

| Need | Component | shadcn/ui command |
|---|---|---|
| Action trigger | `Button` | `npx shadcn@latest add button` |
| Text input | `Input` | `npx shadcn@latest add input` |
| Multi-line text | `Textarea` | `npx shadcn@latest add textarea` |
| Selection (few options) | `Select` | `npx shadcn@latest add select` |
| Selection (many, searchable) | `Combobox` (Command + Popover) | `npx shadcn@latest add command popover` |
| Boolean toggle | `Switch` | `npx shadcn@latest add switch` |
| Data display | `Table` | `npx shadcn@latest add table` |
| Grouped content | `Card` | `npx shadcn@latest add card` |
| Tabbed content | `Tabs` | `npx shadcn@latest add tabs` |
| Side panel | `Sheet` | `npx shadcn@latest add sheet` |
| Notifications | `Sonner` (toast) | `npx shadcn@latest add sonner` |
| Loading placeholder | `Skeleton` | `npx shadcn@latest add skeleton` |
| Date selection | `Calendar` + `Popover` | `npx shadcn@latest add calendar popover` |
| Navigation menu | `NavigationMenu` | `npx shadcn@latest add navigation-menu` |
| Command palette | `Command` | `npx shadcn@latest add command` |
| Status indicator | `Badge` | `npx shadcn@latest add badge` |
| Progress display | `Progress` | `npx shadcn@latest add progress` |
| Collapsible sections | `Accordion` / `Collapsible` | `npx shadcn@latest add accordion collapsible` |
| Breadcrumb navigation | `Breadcrumb` | `npx shadcn@latest add breadcrumb` |

---

## 11. Pre-PR UI/UX Review Checklist

Copy this checklist into every PR that touches frontend code:

```markdown
## UI/UX Review

### Visual Quality
- [ ] Consistent spacing (Tailwind scale, no hardcoded pixels)
- [ ] Typography hierarchy (headings, labels, body text visually distinct)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Loading states present for all async operations (skeleton loaders)
- [ ] Empty states designed (not "No data")
- [ ] Error states are user-friendly with recovery guidance

### Interaction Quality
- [ ] Hover/focus states on all interactive elements
- [ ] Focus rings visible (not suppressed)
- [ ] Form validation on field blur (inline errors)
- [ ] Loading buttons with disabled state during submission
- [ ] Keyboard navigation works (Tab order, Enter/Escape)

### Responsive Design
- [ ] Tested at 320px (mobile)
- [ ] Tested at 768px (tablet)
- [ ] Tested at 1024px+ (desktop)
- [ ] Touch targets >= 44px on mobile
- [ ] No horizontal scroll at any breakpoint (except data tables)

### Accessibility
- [ ] Images have appropriate alt text
- [ ] Form inputs have associated labels
- [ ] ARIA attributes used where semantic HTML is insufficient
- [ ] Color is not the sole differentiator for any information

### Patterns
- [ ] No forbidden patterns used
- [ ] Toasts via Sonner for transient feedback
- [ ] shadcn/ui components used (no custom primitives)
```

---

## 12. Design Tokens and Theming

shadcn/ui uses CSS custom properties for theming, defined in `globals.css`.

**Standard:** All color references use semantic CSS variables, never raw color values.

```tsx
// CORRECT: Semantic token
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">Secondary text</p>
  <Button variant="destructive">Delete</Button>
</div>

// FORBIDDEN: Raw color
<div className="bg-white text-black border-gray-200">
  <p className="text-gray-500">Secondary text</p>
  <button className="bg-red-500 text-white">Delete</button>
</div>
```

**Core semantic tokens:**

| Token | Purpose |
|---|---|
| `background` / `foreground` | Page and primary text |
| `card` / `card-foreground` | Card surfaces |
| `muted` / `muted-foreground` | Subtle backgrounds and secondary text |
| `accent` / `accent-foreground` | Hover states, highlights |
| `destructive` / `destructive-foreground` | Delete, error, danger actions |
| `border` | All borders |
| `ring` | Focus rings |
| `primary` / `primary-foreground` | Primary actions |
| `secondary` / `secondary-foreground` | Secondary actions |
