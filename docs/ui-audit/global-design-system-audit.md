# Global Design System — Comprehensive Audit

**Target:** Entire Kobo application design surface
**Scope:** `src/index.css`, `tailwind.config.ts`, `components.json`, `src/components/ui/*`, `src/components/common/*`, `src/components/*/`, `src/pages/*`, `src/store/settings.ts`, `src/components/theme-provider.tsx`
**Framework:** React 18 + TypeScript + Tailwind CSS 3 + Framer Motion 12 + Radix UI (12 primitives)
**Date:** 2026-07-20

---

## Executive Summary

Kobo has a **functional but fragmented design system**. The bones are solid — HSL custom properties, a 12-primitive Radix UI layer, consistent framer-motion patterns, a well-observed spacing rhythm, and strong accessibility fundamentals. But the system has drifted: the shadcn `Card` component is effectively dead code (replaced by a hand-rolled `rounded-xl border bg-card p-5 shadow-elegant` pattern repeated ~50 times across pages), shadows don't adapt to dark mode, chart colors are duplicated as inline arrays rather than sourced from tokens, and three different focus-ring conventions coexist across input-like components.

The gap is **not** in quality — individual components are well-crafted. The gap is **institutional memory**: there is no single source of truth (`design.md` or `tokens.json`), no component inventory, and no system documentation. The result is that a new developer building a page must guess which pattern to follow, and the guess is almost always right for the first 80% but wrong for the remaining 20%.

**Verdict: A system that works by convention, not enforcement. The conventions are strong enough to produce visual consistency today, but fragile enough that a few more pages will break it. Needs a `design.md`, a component audit, and a dark-mode shadow fix.**

---

## Theme System

### Light / Dark / System Implementation

**Structure:** `src/index.css:6-118` defines `:root` (light) and `.dark` variants using HSL custom properties. `src/components/theme-provider.tsx` toggles `dark`/`light` class on `<html>`. `useSettingsStore` persists the choice. System mode listens to `prefers-color-scheme` via `MediaQueryList`.

**What works:**
- Clean HSL variable architecture — 19 semantic color pairs defined in each mode
- `System` mode resolves via real-time media-query listener, not a one-time check
- Legacy theme migration (`localStorage.getItem("theme")`) is handled
- `resolvedTheme` is correctly memoized

**Issues:**

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Shadow tokens do not adapt to dark mode.** `--shadow-sm/md/lg` use `hsl(222 47% 11%)` as the shadow colour in both light and dark themes. In dark mode, this near-black shadow on a near-black background produces no visible depth — cards appear to float without elevation. | **Critical** | `index.css:54-56` — no `.dark` override |
| 2 | **Gradient custom properties are not redefined in dark mode.** `--gradient-income`, `--gradient-expense`, `--gradient-savings`, `--gradient-balance`, `--gradient-primary` are defined only on `:root`. In dark mode, they render the same saturated HSL values against a dark background, reducing contrast. `--gradient-card` IS redefined (lightens for dark mode), but the other 5 are not. | **Major** | `index.css:47-53` — missing `.dark` overrides |
| 3 | **`System` mode flash.** The `ThemeProvider` returns `null` while `ready` is false (line 77). There is no `class` on `<html>` during this brief period, so the app renders in the browser's default theme (usually light) before switching. | **Minor** | `theme-provider.tsx:77` |
| 4 | **No inline script to prevent FOUC.** The light/dark class is applied via React hydration — no `<script>` in `index.html` reads `localStorage` before the render. Users on dark mode see a light flash on every page load. | **Minor** | `index.html` |

---

## Typography

### Font Stack (`tailwind.config.ts:14-18`)

| Role | Font Family | Fallback |
|------|------------|----------|
| Sans (body) | `Inter` | `system-ui, sans-serif` |
| Display (headings) | `Plus Jakarta Sans` | `Inter, sans-serif` |
| Mono | `JetBrains Mono` | `monospace` |

### Usage (`src/index.css:129-131`)

```css
html { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
body { @apply ... antialiased; font-feature-settings: "cv11", "ss01"; }
```

**What works:**
- Clear role separation (sans/display/mono)
- `antialiased` for subpixel rendering
- OpenType feature flags (`cv11`, `ss01`) for Inter's alternate style
- `font-display` class is used correctly on headings across the app

**What's missing:**
- No `font-display` CSS variable — it's hard-coded in the Tailwind config and in `index.css` as `'Plus Jakarta Sans'`
- No `@fontsource` imports — fonts rely on CDN or system availability; no self-hosting strategy visible
- No variable-font axis configuration (Inter and Plus Jakarta Sans support `wght` axes via variable font, but this is not configured)
- No `font-mono` usage outside of one area — code blocks appear in the landing page hero but the mono font is not widely used

---

## Color Palette

### Architecture

19 semantic colour pairs defined as HSL custom properties, mapped to Tailwind via `colors` in `tailwind.config.ts:19-76`:

| Token | Light | Dark | Delta |
|-------|-------|------|-------|
| `--primary` | `159 64% 36%` | `159 64% 45%` | +9% L (lighter on dark) |
| `--background` | `220 30% 98%` | `222 47% 6%` | Swapped luminance |
| `--muted-foreground` | `220 10% 45%` | `220 10% 60%` | +15% L |
| `--sidebar-background` | `222 47% 11%` | `222 47% 4%` | Darker sidebar (always dark?) |

**Primary hue**: 159 (teal-green). **Background hue**: 220-222 (slate-blue). **Accent**: 38 (amber for warning), 0 (red for destructive), 142 (green for success), 217 (blue for info).

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 5 | **Chart colors are duplicated as inline HSL arrays** across 4+ files (`AccountBalancesChart.tsx:6-10`, `CategoryChart.tsx:6-10`, `DebtBreakdownChart.tsx:7-8`, `Dashboard.tsx:21-25`). No shared token for `chart-1` through `chart-8`. | **Major** | Multiple chart files |
| 6 | **Gradient tokens for stat card icons** (income, expense, savings, balance) are not available as Tailwind utilities — they're custom CSS properties accessible only via `.gradient-income` et al. New pages cannot easily reference them. | **Minor** | `index.css:47-52` |
| 7 | **`--primary-glow`** is a custom property with no Tailwind mapping — it's used only in `index.css` and `Sidebar.tsx:66`. Inconsistent with how other tokens are exposed. | **Minor** | `tailwind.config.ts:28` |
| 8 | **No neutral grey palette** separate from the slate-hued `--muted` / `--border` — all neutrals carry a blue cast (hue 220-222). This is a deliberate choice but may limit use cases. | **Cosmetic** | `index.css` |

---

## Design Tokens

### Current State

- **Where they live:** `src/index.css` as HSL custom properties
- **What's covered:** 19 color pairs, 4 shadows, 6 gradients, 1 border radius, 4 animations
- **What's missing:** No DTCG-format `tokens.json` or `design.md`. No font-size scale (beyond Tailwind defaults). No spacing scale (Tailwind defaults). No motion-duration tokens (all hard-coded in framer-motion props). No z-index scale.

| # | Issue | Severity |
|---|-------|----------|
| 9 | **No single source of truth.** Design tokens exist only as CSS custom properties. There is no `tokens.json`, `design-tokens.yml`, or `design.md` that a designer or AI tool could read. | **Major** |
| 10 | **No font-size tokens.** The app relies entirely on Tailwind's default `text-sm / text-base / text-lg / text-xl / text-2xl / text-4xl` scale. No brand-specific type scale is defined. | **Minor** |
| 11 | **No named motion-duration tokens.** Every framer-motion `duration:` is an inline number (`0.2`, `0.3`, `0.4`, `0.5`, `0.8`, `0.9`). No `--duration-fast / --duration-normal / --duration-slow` pattern. | **Minor** |

---

## Buttons

### Primary Button Component (`src/components/ui/button.tsx`)

6 variants (default, destructive, outline, secondary, ghost, link), 4 sizes (default/sm/lg/icon). Uses `Slot` from Radix for `asChild` polymorphism.

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 12 | **Raw `<button>` elements used throughout the app** instead of the `Button` component. Sidebar collapse, search trigger, notification bell, drawer close, budget insights toggle, color-picker trigger, notification item actions — all use raw `<button>` with ad-hoc Tailwind classes. These bypass the component's variant system, focus-ring consistency, and disabled-state handling. | **Major** | `Sidebar.tsx:80`, `AppLayout.tsx:141,166`, `NotificationDrawer.tsx:96,103`, `NotificationItem.tsx:103,111`, `color-picker.tsx:63-77,82-95`, `BudgetCard.tsx:205-213` |
| 13 | **No loading variant on the Button component.** The `loading` state is handled ad-hoc in each page (e.g., `Login.tsx:141-149` puts a `<Loader2>` inside the button manually). No `isLoading` prop exists on Button. | **Minor** | `button.tsx` |

---

## Cards

### Two Card Systems

| System | Styling | Usage Count |
|--------|---------|-------------|
| `ui/card.tsx` (official) | `rounded-lg border bg-card text-card-foreground shadow-sm` | Used in **0 pages**, **0 feature components** |
| Hand-rolled pattern | `rounded-xl border bg-card p-5 shadow-elegant` | **~50+ instances across all pages and feature components** |

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 14 | **The `Card` component is dead code.** It exists in `src/components/ui/card.tsx` but every page and feature component independently repeats the hand-rolled pattern. The `Card` import is never used outside its own file. This is a DRY violation and a maintenance risk: if the card style needs to change, 50+ locations must be updated individually. | **Critical** | `ui/card.tsx`, all pages |
| 15 | **The hand-rolled pattern uses `rounded-xl` (Tailwind default, 0.75rem) while the Card component uses `rounded-lg` (var(--radius), also 0.75rem).** They coincidentally match the same physical value, but if `--radius` changes, the Card component will update and the hand-rolled pattern will not. | **Major** | Pattern: everywhere; `card.tsx:6` |
| 16 | **`SavingsGoals.tsx:239` uses `rounded-lg border bg-card p-4`** — no `shadow-elegant`, different padding, different rounding. Breaks the card pattern. | **Minor** | `SavingsGoals.tsx:239` |

---

## Inputs

### Component Inventory

| Component | Exists? | Focus Ring | Error State |
|-----------|---------|------------|-------------|
| `Input` | Yes | `focus-visible:` | None (handled by Form wrapper) |
| `Textarea` | Yes | `focus-visible:` | None |
| `Select` | Yes | `focus:` (not `focus-visible`) | None |
| `Switch` | Yes | `focus-visible:` with `ring-offset-background` | N/A |
| `RadioGroup` | Yes | Both `focus:` and `focus-visible:` | N/A |
| `Checkbox` | **No** | — | — |
| `ColorPicker` | Composite | `focus-visible:` (trigger) | None |

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 17 | **Three different focus-ring conventions.** Select uses `focus:outline-none focus:ring-2` (keyboard + mouse), Input uses `focus-visible:outline-none focus-visible:ring-2` (keyboard only), RadioGroup uses both `focus:outline-none` and `focus-visible:ring-2`. Users will see inconsistent focus indicators depending on which input they're using. | **Major** | `select.tsx:20`, `input.tsx:11`, `radio-group.tsx:23` |
| 18 | **RadioGroup uses `border-primary` instead of `border-input`.** This is the only input that uses the primary colour for its border — all others use `border-input`. | **Minor** | `radio-group.tsx:23` |
| 19 | **No `Checkbox` component exists.** Any checkbox UI must be hand-crafted or use DropdownMenuCheckboxItem. | **Minor** | — |
| 20 | **Error state is not built into any input component.** `aria-invalid` and `border-destructive` are handled externally by the Form wrapper. If an Input is used outside a Form context, there is no built-in error styling. | **Minor** | `input.tsx`, `textarea.tsx`, `select.tsx` |

---

## Charts

### Architecture

All charts use Recharts, wrapped in shared `ChartCard` (container) and `ChartTooltip` (cursor) components. An 8-color HSL palette is defined inline in 3 files.

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 21 | **Chart color palette is duplicated as inline arrays** in `AccountBalancesChart.tsx`, `CategoryChart.tsx`, and `DebtBreakdownChart.tsx`. `Dashboard.tsx` defines a 10-color superset. There is no shared export or token reference. Changing the palette requires editing 4+ files. | **Major** | Multiple chart files |
| 22 | **Chart colors are hard-coded HSL values** — they do not reference CSS custom properties. They cannot be swapped by theme (light vs dark) without manual redefinition. | **Major** | All chart files |
| 23 | **`ChartTooltip.tsx` uses inline `style={{}}`** instead of Tailwind classes for background and border, breaking the component's consistency with the rest of the app. | **Minor** | `ChartTooltip.tsx:4-7` |

---

## Tables

### Current State

Four hand-coded `<table>` elements (Dashboard, Transactions, Budgets, DebtPaymentsDrawer) with no shared primitive. `ui/table.tsx` does not exist.

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 24 | **No shared table component.** Four independent table implementations with near-identical patterns. Each duplicates `overflow-x-auto`, `w-full text-sm`, `bg-muted/40 text-xs uppercase tracking-wider`, `border-t border-border hover:bg-muted/30 transition`, and cell padding. | **Major** | All table locations |
| 25 | **Cell padding inconsistencies:** Dashboard/Transactions use `px-5 py-3`, DebtPaymentsDrawer uses `px-4 py-2.5`, Budgets uses `py-2 pr-2`. | **Minor** | `DebtPaymentsDrawer.tsx:106`, `Budgets.tsx:128-160` |

---

## Icons

### Sizing Convention

Well-defined hierarchical pattern:

| Size | Context |
|------|---------|
| `h-3 w-3` (12px) | Inline statistical indicators, trend deltas |
| `h-3.5 w-3.5` (14px) | Compact action buttons, notification actions |
| `h-4 w-4` (16px) | Standard action icons in buttons, dropdowns, inputs |
| `h-5 w-5` (20px) | Primary nav icons (sidebar, header), landing feature icons |
| `h-6 w-6` (24px) | Card header icons (inside colored boxes) |
| `h-7 w-7` (28px) | Hero/CTA large icons |
| `h-8 w-8` (32px) | Empty state icons |

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 26 | **No icon-size tokens or constants.** Every icon's size is specified inline as Tailwind classes. A change to the standard action-icon size (e.g., `h-4` → `h-5`) would require a codebase-wide search-and-replace. | **Minor** | Throughout |
| 27 | **`DashboardPreview.tsx`** uses `h-3.5 w-3.5` for trend icons, while `StatCard.tsx` and `Accounts.tsx` use `h-3 w-3` — a 2px discrepancy in the same usage context. | **Cosmetic** | `DashboardPreview.tsx:23,31` |

---

## Motion

### Findings

11+ distinct framer-motion patterns across 33 files. Extensive and well-executed. Key patterns: fade-in + slide-up (dominant), scale-in (sparkles/success), progress-bar width animation (0.9s easeOut), stagger children (landing page), whileInView (landing page), AnimatePresence (FAQ, notifications), layout animation (BudgetCard), sidebar active indicator (layoutId).

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 28 | **No motion-duration tokens.** 11 different duration values used across the app: `0.15`, `0.2`, `0.3`, `0.4`, `0.5`, `0.6`, `0.7`, `0.8`, `0.9`, `2` (shimmer). All are inline numbers with no semantic naming. | **Minor** | Throughout |
| 29 | **No reduced-motion handling.** The app does not check `prefers-reduced-motion` anywhere. Users with vestibular disorders will see all animations at full speed. framer-motion supports `useReducedMotion()` but it is not used. | **Minor** | Throughout |
| 30 | **`text-base` on mobile `Input`** animates to `md:text-sm` — this causes a layout shift when the viewport crosses 768px. | **Cosmetic** | `input.tsx:11` |

---

## Glassmorphism

### Current State

Used sparingly and consistently:
- Landing page preview cards: `backdrop-blur-sm bg-card/50` + border
- Landing nav: `backdrop-blur-xl bg-background/80`
- App header: `backdrop-blur-md bg-background/80`
- Mobile sidebar overlay: `backdrop-blur-sm bg-foreground/40`
- Radix overlays (Dialog, Sheet, AlertDialog, Drawer): `bg-black/80` — no backdrop-blur

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 31 | **App content cards use solid `bg-card`** — no glassmorphism. This creates a visual disconnect between the landing page (glass previews) and the app (solid cards). The two sections look like different products. | **Cosmetic** | Landing page vs app pages |
| 32 | **Radix overlay components use solid `bg-black/80`** while the sidebar mobile overlay uses `backdrop-blur-sm bg-foreground/40`. Two different overlay patterns in the same app. | **Minor** | `dialog.tsx:22`, `sheet.tsx:22`, `Sidebar.tsx:48` |

---

## Shadows

### Token System (`index.css:54-57`)

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px hsl(222 47% 11% / 0.04)` | Base card component, active tab |
| `shadow-md` (`--shadow-md`) | `0 4px 12px hsl(222 47% 11% / 0.08)` | `shadow-elegant` (card default) |
| `shadow-lg` (`--shadow-lg`) | `0 12px 32px hsl(222 47% 11% / 0.12)` | `shadow-elevated` (hover), overlays |
| `shadow-glow` | `0 8px 24px hsl(159 64% 36% / 0.25)` | Sidebar logo, CTA icon |

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 33 | **No dark-mode shadow definitions.** All shadow tokens use `hsl(222 47% 11% / X)` — a near-black. In dark mode (`--background: 222 47% 6%`), this shadow is nearly invisible against the background. Cards that rely on `shadow-elegant` for visual separation appear flat. This is the single most impactful dark-mode bug. | **Critical** | `index.css:54-57` (no `.dark` override) |
| 34 | **Radix overlays use raw `shadow-lg`** (Tailwind utility) while app cards use custom `shadow-elegant` / `shadow-elevated`. Two parallel shadow systems. | **Minor** | `dialog.tsx:39`, `dropdown-menu.tsx:64`, etc. |

---

## Border Radius

### Token Hierarchy (`tailwind.config.ts:77-81`)

| Class | Value | Derivation |
|-------|-------|------------|
| `rounded-lg` | `var(--radius)` = 0.75rem (12px) | Custom property |
| `rounded-md` | `calc(var(--radius) - 2px)` = 0.625rem (10px) | Derived |
| `rounded-sm` | `calc(var(--radius) - 4px)` = 0.5rem (8px) | Derived |

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 35 | **`rounded-xl` is the de facto card radius but is NOT derived from `--radius`.** It is Tailwind's built-in `xl` (0.75rem), which coincidentally matches `--radius`. If `--radius` changes, cards stay at 12px while buttons/inputs change. | **Major** | All cards, all pages |
| 36 | **`rounded-2xl` (1rem / 16px) is used on landing page components** and the ErrorBoundary icon container, but sits entirely outside the `--radius` token hierarchy. | **Minor** | Landing page, `ErrorBoundary.tsx:36` |

---

## Spacing System

### Current State

The app uses Tailwind's default spacing scale exclusively. No custom spacing tokens are defined.

**Consistent patterns:**
- Page outer containers: `space-y-6` (8 of 9 content pages)
- Card padding: `p-5` (~50+ instances), secondary `p-4`
- Form sections: `space-y-4`, `gap-3` grids
- Button groups: `gap-2`
- Small element spacing: `space-y-1` / `space-y-1.5` / `space-y-2`
- Main content padding: `p-4 sm:p-6 lg:p-8` (from AppLayout)

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 37 | **Dashboard uses `space-y-8`** while all other content pages use `space-y-6`. This creates a slightly airier dashboard at the cost of spacing consistency. | **Cosmetic** | `Dashboard.tsx:60` vs other pages |

---

## Responsive Consistency

### Strengths

- AppLayout padding scales: `p-4` → `sm:p-6` → `lg:p-8`
- Sidebar collapses at `lg` breakpoint with smooth transition
- Grid patterns are very consistent across pages (same `sm:grid-cols-2`, `lg:grid-cols-2`, `xl:grid-cols-3` progressions)
- Table columns hide at standard breakpoints (`hidden sm:table-cell` for Date, `hidden md:table-cell` for Account)
- Auth pages are single-column at all breakpoints (intentional)

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 38 | **No responsive audit for the landing page** — it uses different breakpoint strategies than the app pages, and some sections may overflow on very narrow viewports (320px). | **Minor** | Landing page components |

---

## Accessibility

### Strengths

- Skip-to-content link (`AppLayout.tsx:66-70`)
- Consistent `focus-visible:ring-2 focus-visible:ring-ring` on all interactive elements
- `aria-invalid` and `aria-describedby` on form inputs
- `role="alert"` on error messages
- `aria-label` on icon-only buttons
- `aria-current="page"` on active nav items
- Progress bars with `role="progressbar"`, `aria-valuenow/min/max`
- Semantic HTML: `<nav>`, `<main>`, `<button>`, `<h1-3>`
- Keyboard shortcut: `Ctrl+K` for search

### Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 39 | **No reduced-motion support** (see #29). | **Minor** | — |
| 40 | **Color-picker swatches** (`color-picker.tsx`) use raw `<button>` elements with no `aria-pressed` or `aria-label` on individual color swatches — screen readers cannot identify which colour is selected. | **Minor** | `color-picker.tsx:82-95` |
| 41 | **`EmptyState` uses `role="status"`** (assertive live region) which may interrupt screen reader users. `role="region"` with `aria-labelledby` would be more appropriate. | **Minor** | `EmptyState.tsx:31` |
| 42 | **No focus trap in NotificationDrawer** — keyboard focus is not trapped inside the drawer when open, allowing Tab to escape to page content behind the overlay. | **Minor** | `NotificationDrawer.tsx` |

---

## Component Consistency

### Component Inventory

| Component | Exists? | Used Consistently? |
|-----------|---------|--------------------|
| `Button` | Yes | **No** — raw `<button>` elements bypass it |
| `Card` | Yes | **No** — effectively dead code, hand-rolled pattern used instead |
| `Input` | Yes | Yes |
| `Textarea` | Yes | Yes |
| `Select` | Yes | Yes |
| `Switch` | Yes | Yes |
| `RadioGroup` | Yes | Yes |
| `Checkbox` | **No** | N/A |
| `Avatar` | **No** | N/A |
| `Progress` | **No** | N/A — hand-rolled inline |
| `Accordion` | **No** | N/A — hand-rolled in FAQ |
| `Badge` | Yes | Yes |
| `Tabs` | Yes | Yes |
| `Separator` | Yes | Yes |
| `Dialog` | Yes | Yes |
| `AlertDialog` | Yes | Yes (border inconsistency with Dialog, see #45) |
| `Sheet` | Yes | Yes |
| `Drawer` | Yes | Yes (overlay animation missing, see #46) |
| `Popover` | Yes | Yes |
| `DropdownMenu` | Yes | Yes |
| `Tooltip` | Yes | Yes |
| `ScrollArea` | Yes | Yes |
| `Table` | **No** | N/A |
| `Skeleton` | Yes (`skeleton.tsx`) | Yes |

### Overlay Inconsistencies

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 43 | **`AlertDialogHeader` uses `space-y-2`** while **`DialogHeader` uses `space-y-1.5`**. Minor spacing difference between two nearly identical components. | **Cosmetic** | `alert-dialog.tsx:47`, `dialog.tsx:55` |
| 44 | **`AlertDialogTitle` lacks `leading-none tracking-tight`** that `DialogTitle` has. Inconsistent heading style between the two dialogs. | **Cosmetic** | `alert-dialog.tsx:60`, `dialog.tsx:70` |
| 45 | **`DrawerOverlay` has no animation classes** — all other overlays (Dialog, AlertDialog, Sheet) have `data-[state=open]:animate-in data-[state=closed]:animate-out`. The drawer overlay appears/disappears instantly. | **Minor** | `drawer.tsx:21` |
| 46 | **`DrawerHeader` uses `grid gap-1.5`** vs **`DialogHeader` uses `flex flex-col space-y-1.5`**. Different layout strategies for the same structural role. | **Cosmetic** | `drawer.tsx:47`, `dialog.tsx:55` |
| 47 | **`DropdownMenuSubContent` uses `shadow-lg`** while **`DropdownMenuContent` uses `shadow-md`**. Sub-menus appear more elevated than parent menus (intentional, but undocumented). | **Cosmetic** | `dropdown-menu.tsx:47,64` |
| 48 | **No `Checkbox`, `Avatar`, `Progress`, or `Accordion` Radix components.** These common UI primitives are either missing or hand-rolled, creating inconsistency risk when they are eventually needed. | **Minor** | — |

---

## Design System Roadmap

### Phase 1 — Fix Critical Issues (1–2 days)

1. **Define dark-mode shadow tokens.** Add `.dark` overrides for `--shadow-sm/md/lg/glow` with lighter shadow colors (e.g., `hsl(222 10% 60% / 0.15)`).
2. **Define dark-mode gradient tokens.** Add `.dark` overrides for `--gradient-primary/income/expense/savings/balance`.
3. **Eliminate dead `Card` component.** Either replace all ~50 hand-rolled card instances with the official `Card` (preferred) or update the official `Card` to match the hand-rolled pattern and use it going forward.
4. **Audit shadow token usage in dark mode** — verify all `shadow-elegant` / `shadow-elevated` surfaces are visible.

### Phase 2 — Fix Major Issues (3–5 days)

5. **Create a shared chart-color token set.** Add `--chart-1` through `--chart-8` CSS custom properties and `.dark` variants. Reference them in all chart components.
6. **Standardize focus-ring convention.** Audit all `focus:` and `focus-visible:` usage in input components. Choose one convention (`focus-visible:` for keyboard-only) and apply it universally.
7. **Consolidate raw `<button>` usage.** Replace ~10 raw button elements with the `Button` component.
8. **Build a shared `Table` primitive.** Extract the repeated table pattern into `ui/table.tsx` with `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell` sub-components.
9. **Create a `design.md`** documenting tokens, component inventory, motion durations, spacing scale, and icon-size hierarchy.

### Phase 3 — Fix Minor & Cosmetic (3–5 days)

10. **Add `prefers-reduced-motion` support** via framer-motion's `useReducedMotion()`.
11. **Add CSS custom properties for motion durations** (`--duration-fast: 0.15s`, `--duration-normal: 0.3s`, `--duration-slow: 0.6s`).
12. **Fix overlay animations** — add `data-[state]` animation classes to `DrawerOverlay`.
13. **Fix Dialog/AlertDialog/Space inconsistencies** — align `AlertDialogHeader` with `DialogHeader`.
14. **Add `Checkbox` and `Progress` components** to fill the gap in the component library.
15. **Add font-size custom properties** to define a brand type scale.
16. **Address the Dashboard `space-y-8` outlier** (consider if intentional).

---

## Count

**3 critical · 10 major · 22 minor · 6 cosmetic**
