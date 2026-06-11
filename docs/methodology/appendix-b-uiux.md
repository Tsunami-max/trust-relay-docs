---
sidebar_position: 11
title: "Appendix B: UI/UX Standard"
description: "This appendix specifies the UI/UX standards for all frontend applications built under the S4U Development Methodology. These are standards, not suggestions."
---


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

shadcn/ui is **not** installed as a direct dependency in `package.json`. Components are scaffolded into `src/components/ui/` as source files that you own and can modify. This is a fundamental distinction from dependency-based design systems.

**Why shadcn/ui over alternatives:**

| Property | shadcn/ui | Material UI | Chakra UI | Radix UI (raw) |
|---|---|---|---|---|
| Ownership | Source code in your repo | Dependency you cannot modify | Dependency you cannot modify | Primitives only, no styling |
| Styling | Tailwind CSS native | CSS-in-JS (Emotion) | CSS-in-JS (Emotion) | BYO styling |
| Accessibility | Built on Radix primitives (WCAG AA) | Built-in | Built-in | Built-in (unstyled) |
| Bundle size | Zero — components are source code | 300KB+ (tree-shakeable) | 200KB+ | Minimal |
| Customization | Full control — edit the source | Theme overrides, limited | Theme overrides | Full control |
| Tailwind alignment | Native | Friction | Friction | Compatible |

The decisive factor is ownership. When a design system is a dependency, customization means fighting the library's opinions. When components are source files in your repository, customization is editing a file. For applications that need to look distinctive (branded portals, enterprise dashboards), this difference is the difference between hours and days of styling work.

**Forbidden:** Building custom UI primitives (buttons, inputs, selects, dialogs, tables, cards, tooltips, popovers) when a shadcn/ui component exists. Custom components introduce inconsistency, accessibility gaps, and maintenance burden.

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

This installs Sonner via the shadcn/ui integration, which provides a pre-styled `<Toaster />` component and a `toast()` function consistent with the design system.

**Usage pattern:**

```tsx
import { toast } from "sonner"

// Success
toast.success("Case approved successfully")

// Error
toast.error("Failed to upload document. Please try again.")

// Promise-based (shows loading → success/error automatically)
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

**Why Sonner over alternatives:**

- **Not `window.alert()`**: Native alert boxes are modal (block the UI thread), unstyled (break visual coherence), and provide no customization (no icons, no actions, no auto-dismiss). They are a developer convenience that punishes the user.
- **Not `react-hot-toast`**: Sonner provides richer features (promise toasts, action buttons, custom rendering) with better accessibility and smoother animations.
- **Not custom toast implementations**: Custom toast systems invariably miss edge cases (stacking, dismissal, keyboard access, screen reader announcements). Sonner handles all of these.

**Forbidden:**
- `window.alert()` — blocks the thread, breaks the experience
- `window.confirm()` — see Section 9 (Forbidden Patterns)
- Custom notification systems — unless Sonner cannot handle the specific use case (document the exception)

---

## 3. Visual Quality Checklist

Every component, page, and feature must pass this checklist before merge. These are not aspirational goals — they are blocking review criteria.

### 3.1 Spacing

- [ ] All spacing uses the design system's scale (Tailwind: `p-2`, `p-4`, `p-6`, `gap-4`, `space-y-4`, etc.)
- [ ] No hardcoded pixel values for spacing (no `style={{ padding: '13px' }}`)
- [ ] Consistent spacing between related elements (same gap within a group, larger gap between groups)
- [ ] Adequate whitespace around content blocks — crowded layouts signal amateur work

**Rationale:** Inconsistent spacing is the single most common visual defect in AI-generated UIs. The AI produces functionally correct layouts with visually jarring spacing because it treats spacing as an implementation detail rather than a design decision. Enforcing the design system's spacing scale eliminates this class of defect mechanically.

### 3.2 Typography

- [ ] Headings follow a clear hierarchy (`h1` > `h2` > `h3`, with visible size differentiation)
- [ ] Body text uses the design system's default size (typically `text-sm` or `text-base`)
- [ ] Line height is appropriate for readability (`leading-relaxed` for body text, `leading-tight` for headings)
- [ ] Font weight distinguishes labels from values, headings from body text
- [ ] No more than 2-3 font sizes per view (visual noise increases with font size variation)

**Rationale:** Typography hierarchy communicates information architecture. When all text is the same size and weight, the user must read everything to find what matters. When headings, labels, and values are visually distinct, the user's eye is guided to the information they need.

### 3.3 Color Contrast

- [ ] Text-to-background contrast meets WCAG AA minimum: **4.5:1** for normal text, **3:1** for large text (18px+ or 14px+ bold)
- [ ] Interactive elements are visually distinct from static content
- [ ] Status indicators use semantic colors (green=success, red=error, amber=warning, blue=info) consistently throughout the application
- [ ] Color is never the sole differentiator — always pair with icons, text, or shape

**Rationale:** 8% of men and 0.5% of women have color vision deficiency. Compliance applications handle sensitive decisions (approve/reject/escalate) where misreading a status indicator has real consequences. Adequate contrast and redundant encoding prevent this.

### 3.4 Loading States

- [ ] Every async operation has a visible loading state
- [ ] Content areas use skeleton loaders (see Section 7)
- [ ] Action buttons show a loading spinner and are disabled during submission
- [ ] Loading states match the layout of the loaded content (no layout shift)

**Rationale:** Users interpret a static screen as frozen or broken. A loading state communicates that the system is working. Skeleton loaders that match the final layout prevent the jarring "content pop" that occurs when data arrives and the page reflows.

### 3.5 Empty States

- [ ] Every list, table, and data view has a designed empty state
- [ ] Empty states include: an illustration or icon, a descriptive message, and (where applicable) a call-to-action
- [ ] Empty states never display raw text like "No data" or "[]" or an empty white space
- [ ] First-use empty states are distinct from filtered-to-zero empty states ("You haven't created any cases yet" vs "No cases match your filters")

**Rationale:** Empty states are the first thing a new user sees. A blank screen or a terse "No data" message communicates that the product is unfinished. A well-designed empty state communicates that the product anticipated this situation and guides the user toward their next action.

### 3.6 Error States

- [ ] Error messages are written for users, not developers ("Unable to save your changes. Please try again." not "500 Internal Server Error: connection refused")
- [ ] Error states suggest a recovery action where possible ("Try again", "Check your connection", "Contact support")
- [ ] Form validation errors appear inline next to the relevant field, not in a banner at the top of the form
- [ ] Errors are visually distinct (red/destructive color, error icon) but not alarming (no ALL CAPS, no exclamation marks)

**Rationale:** Technical error messages erode user confidence. A user who sees "ECONNREFUSED" does not know whether to retry, refresh, or file a bug report. An error message that says "We couldn't reach the server. Please check your internet connection and try again." tells the user exactly what to do.

---

## 4. Interaction Quality Checklist

### 4.1 Hover and Focus States

- [ ] Every interactive element (button, link, card, row) has a visible hover state
- [ ] Every focusable element has a visible focus ring (Tailwind: `focus-visible:ring-2 focus-visible:ring-ring`)
- [ ] Hover and focus states are visually distinct from default and active states
- [ ] Focus rings are not suppressed — never use `outline-none` without a replacement focus indicator

**Rationale:** Hover states communicate interactivity — the user learns what is clickable by moving their cursor. Focus rings enable keyboard navigation — without them, keyboard-only users (including many screen reader users) cannot determine which element is active. Suppressing focus rings for aesthetic reasons is an accessibility violation.

### 4.2 Form Validation

- [ ] Validation errors appear on field blur (not on every keystroke, not only on submit)
- [ ] Errors display inline, directly below the field, in the destructive/red color
- [ ] Invalid fields have a visible border color change (Tailwind: `border-destructive`)
- [ ] The submit button remains enabled but shows validation errors on click if the form is invalid
- [ ] Required fields are marked (asterisk or "Required" label)
- [ ] Success states are shown for validated fields where appropriate (check icon)

**Rationale:** Real-time keystroke validation is distracting (the field turns red after the first character of an email address). Submit-only validation forces users to scroll up to find what went wrong. Blur validation hits the sweet spot: the user commits to a value by leaving the field, and immediate feedback appears if the value is invalid.

### 4.3 Loading Buttons

- [ ] Buttons that trigger async operations show a spinner icon during the operation
- [ ] Loading buttons are disabled to prevent double-submission
- [ ] Button text changes to indicate the action in progress ("Save" → "Saving..." or shows spinner)
- [ ] Button width does not change when text changes (use `min-w-` or fixed width)

**Rationale:** Double-submission is one of the most common UI bugs in web applications. A user clicks "Submit," nothing visually happens, so they click again. The server receives two requests. Loading buttons prevent this mechanically: the button is visually and functionally disabled the instant the user clicks.

### 4.4 Keyboard Navigation

- [ ] All interactive elements are reachable via Tab key in a logical order
- [ ] Dialogs trap focus (Tab does not escape the dialog)
- [ ] Escape closes the topmost overlay (dialog, sheet, popover, dropdown)
- [ ] Enter activates the focused button or submits the focused form
- [ ] Arrow keys navigate within composite widgets (tabs, menus, radio groups)

**Rationale:** Keyboard navigation is not an accessibility edge case. Power users prefer keyboard navigation for speed. Screen reader users require it. Tab order that follows visual order (not DOM order) ensures that the navigation experience matches what sighted users expect.

### 4.5 Skeleton Loaders

- [ ] Content areas display skeleton placeholders while data is loading
- [ ] Skeleton shapes approximate the final content layout (rectangles for text, circles for avatars, cards for card layouts)
- [ ] Skeletons animate with a subtle shimmer (Tailwind: `animate-pulse`)
- [ ] Skeletons are replaced by content without layout shift (same dimensions)

**Rationale:** See Section 7 (Modern Patterns) for the full rationale on why skeleton loaders replace spinners.

---

## 5. Responsive Design Targets

### Breakpoints

| Breakpoint | Width | Target devices | Layout expectations |
|---|---|---|---|
| Mobile | 320px minimum | Phones | Single column, stacked layout, hamburger menu |
| Tablet | 768px | Tablets, small laptops | Two columns where appropriate, collapsible sidebar |
| Desktop | 1024px+ | Laptops, monitors | Full layout with sidebar, multi-column content |

These are minimum widths. The application must be usable at each breakpoint, not merely render without overflow.

### Touch Targets

- [ ] All interactive elements have a minimum touch target of **44x44 pixels** on mobile viewports
- [ ] This applies to buttons, links, icons, checkboxes, radio buttons, and custom interactive elements
- [ ] Adjacent touch targets have adequate spacing (minimum 8px gap) to prevent mis-taps
- [ ] If a visual element is smaller than 44px (e.g., an icon button), the clickable area must still be 44x44px (use padding)

**Rationale:** Apple's Human Interface Guidelines and WCAG 2.5.5 (Target Size) both specify minimum touch target sizes. 44px is the industry consensus for reliable finger targeting. Smaller targets cause mis-taps, especially on mobile devices used in suboptimal conditions (walking, one-handed, gloves).

### Responsive Implementation Rules

- [ ] Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) — never CSS media queries in component styles
- [ ] Test at 320px, 768px, and 1024px during development (browser DevTools responsive mode)
- [ ] Navigation collapses to hamburger menu at mobile breakpoint
- [ ] Data tables become scrollable or switch to card layout on mobile
- [ ] Forms remain single-column on mobile (no side-by-side fields below 768px)

---

## 6. Accessibility Checklist (WCAG AA)

This methodology targets WCAG AA compliance as the minimum accessibility standard. WCAG AAA is aspirational but not required.

### 6.1 Color Contrast

- [ ] Normal text (< 18px): minimum **4.5:1** contrast ratio against background
- [ ] Large text (>= 18px or >= 14px bold): minimum **3:1** contrast ratio
- [ ] UI components and graphical objects: minimum **3:1** against adjacent colors
- [ ] Verify with a contrast checker tool (e.g., WebAIM Contrast Checker, Chrome DevTools)

### 6.2 Images and Icons

- [ ] Informational images have descriptive `alt` text
- [ ] Decorative images use `alt=""` (empty alt, not missing alt)
- [ ] Icon-only buttons have `aria-label` or visually hidden text
- [ ] Complex images (charts, diagrams) have text alternatives or descriptions

### 6.3 Forms

- [ ] Every input has a visible `<label>` associated via `htmlFor`/`id`
- [ ] Required fields are indicated both visually and programmatically (`aria-required="true"`)
- [ ] Error messages are associated with fields via `aria-describedby`
- [ ] Form groups use `<fieldset>` and `<legend>` where appropriate (e.g., radio groups)

### 6.4 ARIA Attributes

- [ ] Custom interactive components use appropriate ARIA roles (`role="button"`, `role="dialog"`, `role="alert"`)
- [ ] Dynamic content updates use `aria-live` regions ("polite" for non-urgent, "assertive" for critical)
- [ ] Expandable sections use `aria-expanded` state
- [ ] Tab interfaces use `role="tablist"`, `role="tab"`, `role="tabpanel"` with proper `aria-selected` state

**Rule:** Prefer semantic HTML over ARIA. A `<button>` is always better than `<div role="button">`. ARIA is for cases where semantic HTML does not provide the needed semantics.

### 6.5 Focus Management

- [ ] Focus is moved to newly opened dialogs, sheets, and modals
- [ ] Focus returns to the trigger element when a dialog closes
- [ ] Skip-to-content link exists for pages with navigation
- [ ] No focus traps outside of modal dialogs

---

## 7. Modern Patterns (Required)

These patterns are required in all new development. They replace older patterns that are forbidden (see Section 9).

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

// FORBIDDEN: Spinner for content
function CaseList() {
  if (loading) return <Spinner /> // Do not do this
  return <div>...</div>
}
```

**Why skeleton loaders over spinners:**

1. **Perceived performance.** Skeleton loaders make the application feel faster because they show the page structure immediately. The user's mental model of the page is established before data arrives. Spinners provide no structural information — the user sees a spinning icon and waits.

2. **No layout shift.** Skeleton loaders occupy the exact space the content will fill. When data arrives, the skeleton is replaced without any page reflow. Spinners typically sit in the center of an empty container; when content arrives, the page jumps.

3. **Reduced anxiety.** A skeleton screen communicates "content is coming, here is where it will appear." A spinner communicates "something is happening, I cannot tell you what or how long." For compliance applications where officers make high-stakes decisions, reducing anxiety in the interface is not cosmetic — it is functional.

**Exception:** Spinners are appropriate for action-in-progress indicators (inside buttons, inline with status text) where the spinner replaces a small element, not a content area. Example: a button that shows a spinner icon while submitting.

### 7.2 Toast Notifications (Not Alert Boxes)

See Section 2 (Sonner). All transient feedback uses toast notifications.

### 7.3 Command Palette

**Standard:** Applications with more than 10 distinct actions or views should implement a command palette accessible via `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux).

```bash
npx shadcn@latest add command
```

The command palette provides keyboard-first navigation for power users. It indexes pages, actions, and entities (e.g., "Go to Case #1234", "Create new case", "Open settings").

**Why:** Power users — and compliance officers who use the application daily are power users — prefer keyboard shortcuts to mouse navigation. A command palette provides universal keyboard access to every application function without requiring the user to memorize individual shortcuts. The investment is one component; the return is significantly faster task completion for daily users.

### 7.4 Optimistic Updates

**Standard:** For operations where success is the overwhelmingly likely outcome (toggling a flag, updating a name, reordering items), update the UI immediately and reconcile with the server response.

```tsx
// CORRECT: Optimistic update
function toggleFlag(caseId: string) {
  // Update UI immediately
  setCases(prev => prev.map(c =>
    c.id === caseId ? { ...c, flagged: !c.flagged } : c
  ))

  // Reconcile with server
  api.toggleFlag(caseId).catch(() => {
    // Revert on failure
    setCases(prev => prev.map(c =>
      c.id === caseId ? { ...c, flagged: !c.flagged } : c
    ))
    toast.error("Failed to update flag")
  })
}
```

**Why:** The user clicked a button. They expect a response. A 200ms round-trip to the server before showing the result feels sluggish. An optimistic update shows the result instantly and rolls back on the rare failure. The tradeoff is implementation complexity (rollback logic) for a dramatically faster perceived experience.

**When NOT to use:** Do not use optimistic updates for irreversible or high-consequence operations (approve/reject decisions, document deletion, financial transactions). These operations must show a loading state and wait for server confirmation before updating the UI. The user needs to see that the system took their high-stakes action seriously.

### 7.5 Inline Confirmations

**Standard:** Destructive actions use inline confirmation patterns, not modal dialogs.

```tsx
// CORRECT: Inline confirmation
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

**Why:** Modal confirmation dialogs interrupt the user's flow, steal focus, and require a context switch. For routine destructive actions (removing a document from a list, clearing a filter), the cost of the modal exceeds the cost of an accidental action — especially when the action is reversible. Inline confirmation keeps the user in context while still requiring an explicit second click.

**Exception:** For irreversible, high-consequence actions where the impact is severe and there is no undo (e.g., permanently deleting an entire case with all evidence), a Sheet or Dialog from shadcn/ui is acceptable. The dialog must explain the consequences and require explicit confirmation text.

### 7.6 Smooth Transitions

**Standard:** State transitions (expand/collapse, show/hide, page changes) use CSS transitions in the 150-300ms range with `ease-out` timing.

- **150ms** for micro-interactions (hover effects, toggle states, tooltip appearance)
- **200ms** for component transitions (accordion expand, dropdown open, tab switch)
- **300ms** for page-level transitions (sheet slide-in, dialog fade-in, route transitions)

**Why:** Transitions below 100ms are imperceptible. Transitions above 400ms feel sluggish. The 150-300ms range provides visual continuity (the user sees the state change happen rather than a jarring cut) without introducing perceived latency.

---

## 8. Reference Designs

These applications set the aesthetic and interaction quality bar. They are not templates to copy; they are benchmarks to match.

### Stripe Dashboard

**What to study:** Information density without clutter. Data tables that present complex financial data clearly. Navigation that scales to dozens of sections without becoming overwhelming. The use of subtle borders, shadows, and background color differences to create visual hierarchy without heavy styling.

**Applicable to:** Enterprise dashboards, data-heavy views, settings pages.

### Linear

**What to study:** Speed. Every interaction feels instant. Keyboard-first design where every action has a shortcut. Command palette that indexes everything. Clean typography with minimal decoration. The use of animation to communicate state changes without distracting.

**Applicable to:** Task management views, workflow interfaces, any view where power users perform repetitive actions.

### Vercel Dashboard

**What to study:** Modern minimalism. Excellent use of whitespace. Real-time status indicators that communicate system state at a glance. Responsive design that works genuinely well on mobile, not just "doesn't break."

**Applicable to:** Status dashboards, deployment/process monitoring views, developer-facing tools.

### Notion

**What to study:** Rich interactions (drag-and-drop, inline editing, slash commands) that remain intuitive. Exceptional empty states that guide new users. The "/" command menu as a discovery mechanism for features. Gradual disclosure — the interface appears simple until you need complexity.

**Applicable to:** Content-heavy interfaces, document editors, any view where users create and organize structured content.

---

## 9. Forbidden Patterns

These patterns are explicitly prohibited. Each entry explains the failure mode that the pattern creates.

### 9.1 Modal Dialogs for Simple Confirmations

**Forbidden:** Using `<Dialog>` or `window.confirm()` for routine confirmations ("Are you sure you want to delete this item?").

**Why forbidden:** Modal dialogs break flow. They steal focus from the user's current context, dim the background (removing visual context the user may need), and require the user to make a decision about a new UI element (the dialog) before returning to their original task. For actions that occur frequently (removing an item, clearing a field, resetting a filter), this interruption accumulates into significant friction.

**Use instead:** Inline confirmation (Section 7.5) for routine destructive actions. Toast with undo for reversible actions. Sheet with explanation for high-consequence irreversible actions.

### 9.2 Full-Page Loaders

**Forbidden:** Showing a full-page spinner or loading screen while content loads.

**Why forbidden:** Full-page loaders destroy perceived performance. The user sees nothing for the entire load duration, then everything appears at once. This is the worst possible loading experience because it provides zero progressive feedback. The user cannot tell whether the page will load in 0.5 seconds or 30 seconds.

**Use instead:** Skeleton loaders for content areas (Section 7.1). Render the page shell (navigation, headers, layout) immediately and show skeletons only in content areas. The user sees the application structure instantly and content fills in progressively.

### 9.3 Native Alert/Confirm/Prompt Boxes

**Forbidden:** `window.alert()`, `window.confirm()`, `window.prompt()`.

**Why forbidden:** Native browser dialogs are modal (block the entire page), unstyled (clash with every design system), inaccessible to customization (cannot add icons, actions, or branding), and present a security concern (users are trained to distrust browser dialogs due to phishing). They signal that the developer prioritized implementation convenience over user experience.

**Use instead:** Toast notifications (Section 2) for alerts. Inline confirmation (Section 7.5) for confirms. Form fields or Sheet components for prompts.

### 9.4 Spinners for Content Loading

**Forbidden:** Using a spinner (rotating circle) as the loading state for content areas (lists, tables, cards, page bodies).

**Why forbidden:** See Section 7.1 for the full rationale. Spinners provide no structural preview, cause layout shift, and increase perceived wait time compared to skeleton loaders.

**Allowed exception:** Spinners inside buttons during action submission (Section 7.1 exception).

### 9.5 Tiny Click/Touch Targets

**Forbidden:** Interactive elements smaller than 44x44 pixels on any viewport where touch input is possible.

**Why forbidden:** Small targets cause mis-taps, which cause frustration, which causes users to slow down to aim carefully, which destroys the perception of speed. For compliance officers using the application on tablets during site visits, mis-tapping an "Approve" button and accidentally hitting "Reject" is not an inconvenience — it is an operational error with regulatory consequences.

**Use instead:** Adequate padding on all interactive elements. If the visual element must be small (e.g., an icon button in a dense table), expand the clickable area with padding while keeping the visual element compact.

### 9.6 Unstyled or Generic Error Pages

**Forbidden:** Showing raw error codes, stack traces, or generic "Something went wrong" pages without recovery guidance.

**Why forbidden:** Users who encounter an error need two pieces of information: (1) what happened in terms they understand, and (2) what they can do about it. A raw `500 Internal Server Error` provides neither. A generic "Something went wrong" provides (1) but not (2). Every error state must be designed with the same care as every success state.

### 9.7 Horizontal Scroll on Mobile

**Forbidden:** Layouts that require horizontal scrolling on viewports >= 320px (excluding data tables with explicit horizontal scroll containers).

**Why forbidden:** Users do not expect horizontal scrolling on mobile. Content that extends beyond the viewport is invisible — users will not discover it. Data tables are a documented exception because tabular data sometimes requires width that exceeds mobile viewports; in that case, the table must be in a scroll container with visual affordance (fade/shadow at the scroll edge) indicating that more content exists.

---

## 10. Component Selection Guide

When building a new feature, use this guide to select the correct component for common UI needs.

| Need | Component | shadcn/ui command |
|---|---|---|
| Action trigger | `Button` | `npx shadcn@latest add button` |
| Text input | `Input` | `npx shadcn@latest add input` |
| Multi-line text | `Textarea` | `npx shadcn@latest add textarea` |
| Selection (few options) | `Select` | `npx shadcn@latest add select` |
| Selection (many options, searchable) | `Combobox` (Command + Popover) | `npx shadcn@latest add command popover` |
| Boolean toggle | `Switch` | `npx shadcn@latest add switch` |
| Checkbox (multi-select) | `Checkbox` | `npx shadcn@latest add checkbox` |
| Data display | `Table` | `npx shadcn@latest add table` |
| Grouped content | `Card` | `npx shadcn@latest add card` |
| Tabbed content | `Tabs` | `npx shadcn@latest add tabs` |
| Side panel | `Sheet` | `npx shadcn@latest add sheet` |
| Notifications | `Sonner` (toast) | `npx shadcn@latest add sonner` |
| Loading placeholder | `Skeleton` | `npx shadcn@latest add skeleton` |
| Date selection | `Calendar` + `Popover` | `npx shadcn@latest add calendar popover` |
| File upload | `Input` (type="file") + custom dropzone | Use `react-dropzone` with shadcn styling |
| Navigation menu | `NavigationMenu` | `npx shadcn@latest add navigation-menu` |
| Command palette | `Command` | `npx shadcn@latest add command` |
| Contextual info | `Tooltip` | `npx shadcn@latest add tooltip` |
| Rich detail on hover/click | `Popover` or `HoverCard` | `npx shadcn@latest add popover hover-card` |
| Status indicator | `Badge` | `npx shadcn@latest add badge` |
| Progress display | `Progress` | `npx shadcn@latest add progress` |
| Collapsible sections | `Accordion` or `Collapsible` | `npx shadcn@latest add accordion collapsible` |
| Breadcrumb navigation | `Breadcrumb` | `npx shadcn@latest add breadcrumb` |

---

## 11. Pre-PR UI/UX Review Checklist

Copy this checklist into every PR that touches frontend code. Every item must be checked before the PR is approved.

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
- [ ] No forbidden patterns used (modal confirms, spinners for content, native alerts, tiny targets)
- [ ] Toasts via Sonner for transient feedback
- [ ] shadcn/ui components used (no custom primitives)
```

---

## 12. Design Tokens and Theming

shadcn/ui uses CSS custom properties for theming, defined in `globals.css`. The default theme provides light and dark mode support.

**Standard:** All color references in components use the semantic CSS variables, never raw color values.

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

**Why:** Raw color values break dark mode, prevent consistent theming, and create maintenance burden when the color palette changes. Semantic tokens (`background`, `foreground`, `muted`, `destructive`) automatically adapt to the active theme.

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
| `primary` / `primary-foreground` | Primary actions (buttons, links) |
| `secondary` / `secondary-foreground` | Secondary actions |

---

**End of Appendix B: UI/UX Standard**
