# Dashboard UI/UX Audit

**Target:** `/dashboard` — `src/pages/Dashboard.tsx`
**Components:** `StatCard`, `BudgetCard`, `PageHeader`, `EmptyState`, `PageSkeleton`
**Framework:** React 18 + TypeScript + Tailwind CSS + Framer Motion + Recharts
**Date:** 2026-07-20

---

## Executive Summary

The Kobo Dashboard is a capable financial overview page with solid technical foundations. It presents 5 summary stat cards, 4 charts (income vs expenses, spending by category, monthly expenses, cash flow), monthly savings contributions, current budgets, and a paginated recent-transactions table. The visual language is consistent, the sidebar navigation is well-executed, and the component structure is clean.

However, the page exhibits a **template quality ceiling**: it reads as a standard admin dashboard template rather than a designed product experience. The layout is a single-stack vertical sequence with regular rhythm—section after section, each the same width, each with identical padding and card treatment. The page has 5 charts of roughly equal visual weight, creating information overload without progressive disclosure. The `shadow-elegant` and `shadow-elevated` tokens reference the same shadow variables regardless of theme, causing a **shadow-glow-on-dark** anti-pattern in dark mode (gate 40).

The dashboard also has a **scope ambiguity** with the Reports page (`/reports`), which uses the title "Analytics Dashboard" and duplicates several chart types, creating confusion about which page to visit for what purpose.

**Verdict: Close, but needs structural editing and dark-mode shadow fix to shed the template feel.**

---

## UI Review

### Summary Cards (StatCard)
- 5 cards in a responsive grid: Total Balance, Income, Expenses, Cash Saved, Total Saved
- Each card: label (uppercase tracking), large value (compact for >999k), delta badge, gradient icon box, sparkline area chart
- **Sparkline container is `max-w-[120px]`** — too narrow to convey meaningful trend signal; at that size the area fill is the only visible feature, not the line shape
- Delta badges use `bg-success/10 text-success` / `bg-destructive/10 text-destructive` — semantic and clear
- Variant overlays with per-variant gradients (`gradient-balance`, `gradient-income`, etc.) create a **chromatic spread** problem: 5 different gradient background colors on icons, plus the pie chart uses a 10-color palette, plus the charts use green/red/purple — the page has ~8 distinct hues competing for attention
- The `Total Balance` → `Cash Saved (Month)` → `Total Saved` progression is redundant: `Cash Saved` and `Total Saved` are near-duplicate metrics with different time windows, creating cognitive overhead

### Charts
| Chart | Type | Position | Notes |
|---|---|---|---|
| Income vs Expenses | Grouped bar | Top charts row, span 2 | Good, clear comparison |
| Spending by Category | Donut (inner 45/outer 75) | Top charts row, span 1 | 4-category legend below |
| Monthly Expenses | Line | Second charts row | Duplicates the `expenses` bar from chart 1 |
| Cash Flow | Area with gradient fill | Second charts row | Valuable, but area gradient uses same green as income bars |
| Monthly Savings Contributions | Bar | Full-width below | Useful, but adds a 5th chart to an already chart-dense page |

**Key finding:** The Monthly Expenses line chart (lines 157–175) shows the exact same `monthlyChart` data as the expenses bars in the Income vs Expenses chart (lines 98–114). Two charts, same data, different visual encodings, one column apart. This is redundant and consumes screen real estate that could surface something else.

### Financial Overview
- The Income vs Expenses bar chart is the primary financial overview — 6-month window, grouped bars, green/red
- Tooltip styling is consistent across all charts (`popover` bg, `border` border, `8px` radius, `12px` font)
- **No date-range selector** exists on the dashboard; the 6-month window is hardcoded. Users cannot zoom, filter by quarter, or compare custom periods
- Y-axis formatting uses `formatNaira` with `compact: true` — good for scanability

### Recent Transactions
- Full table with description (icon + type), category (badge), account, date, amount
- Search filters by description/category/account text
- Dropdown filter: All / Income / Expense / Transfer
- Dropdown sort: Newest / Oldest / Highest / Lowest
- Pagination: 5 per page, prev/next buttons, page counter
- Empty state: centered "No transactions match your search"
- **Missing:** column sorting (click header to sort), bulk actions, export
- **Missing:** inline edit or quick-categorize

### Quick Actions
- "View Reports" (outline button)
- "New Transaction" (primary button with + icon)
- "Manage Budgets" (outline link below budget section)
- Global "Add Transaction" in sticky header
- **Issue:** The two primary actions (New Transaction, View Reports) sit inside the `PageHeader` component, which is visually subdued. The most common user action (adding a transaction) should be more prominent or persistent

### Navigation
- Left sidebar with 9 items, Dashboard is first
- Active state with animated `layoutId` indicator bar — smooth
- Collapsible sidebar with smooth transition
- Mobile overlay with backdrop blur
- Skip-to-content link present
- Sticky header with global search, notifications, theme toggle, add transaction
- **Global search** is well-implemented: cross-entity search (transactions, budgets, accounts, goals, debts), inline results, keyboard dismiss

### Widget Placement
- Sections stack vertically: Text → Stats → Charts (2-column) → Charts (2-column) → Full-width chart → Budgets → Full-width table
- No variability in section width — every section is `max-width: 100%` within the main content area
- Stat cards jump from `grid-cols-1` → `grid-cols-2` → `grid-cols-5` — the jump from 2 to 5 on xl screens is harsh; the 5th card wraps awkwardly on intermediate widths

### Information Density
- **High** — 5 stat cards, 5 charts, 4 budget cards, and a full transaction table all on one viewport
- Users must scroll through ~3 viewports to see everything
- No collapsible sections or "show more" toggles
- The transaction table at the bottom gets less attention despite being one of the most actionable sections

### Visual Hierarchy
- Page title `h1` ("Welcome back, {name}") is prominent at `text-2xl sm:text-3xl font-bold`
- Section headings use `font-display font-semibold` (various sizes)
- Chart descriptions use `text-xs text-muted-foreground` — very small, may be hard to read
- Transaction amounts use `font-semibold` with green for income
- **Issue:** All cards look the same (same `rounded-xl border border-border bg-card p-5 shadow-elegant`), providing no visual differentiation between primary metrics, secondary charts, and tertiary tables

### Typography
- Body: Inter (system-ui fallback) — `font-feature-settings: "cv11", "ss01"`
- Display: Plus Jakarta Sans (Inter fallback)
- Mono: JetBrains Mono
- **Assessment:** Good pairing with appropriate weights. Inter and Plus Jakarta Sans are both geometric neo-grotesks — close cousins — so the hierarchy between display and body is subtle. This is borderline **Inter-everywhere** (anti-pattern), though the pairing is defensible.

### Color Usage
- HSL custom properties in `:root` and `.dark`
- Green (`142 71% 45%`) for income/success
- Red (`0 72% 51%`) for expenses/destructive
- Purple (`259 80% 60%`) for balance
- Blue (`217 91% 60%`) for savings
- Primary is teal-green (`159 64% 36%`)
- **COLORS array** (lines 21–25) duplicates 10 hardcoded HSL values that partially overlap with theme tokens but aren't derived from them — token drift risk
- **Shadow tokens are not overridden in `.dark`** — `--shadow-md`, `--shadow-lg` use `hsl(222 47% 11%)` with opacity, which on dark backgrounds produces a soft colored halo (shadow-glow-on-dark)

### Glassmorphism
- Only used on the sticky header (`bg-background/80 backdrop-blur-md`) — purposeful and restrained
- Mobile overlay uses `bg-foreground/40 backdrop-blur-sm` — appropriate

### Spacing
- Page sections: `space-y-8` gap
- Card padding: `p-5`
- Table cells: `px-5 py-3`
- Grid gaps: `gap-4`
- **No variation** between section spacing — every section has identical vertical rhythm, contributing to the template feel

---

## UX Review

### User Workflows
1. **Landing → Login → Dashboard** — standard auth flow, well-implemented
2. **Dashboard → New Transaction** — top-right header button + PageHeader button
3. **Dashboard → View Reports** — navigates to `/reports` (which itself is titled "Analytics Dashboard")
4. **Dashboard → Manage Budgets** → `/budgets`
5. **Dashboard → Budget Card → dropdown actions** (view transactions, edit, delete)
6. **Dashboard → Transaction table → search/filter/sort/paginate**

### Discoverability
- Search (global) is in the sticky header — good
- Transaction search is within the table section — expected location
- Budget card dropdown actions (View Transactions, Show Insights, Edit, Delete) — the kebab menu is discoverable but the "Show Insights" toggle is low-awareness
- **No quick-search for categories or budgets** from the dashboard itself

### Dashboard Personalization Opportunities
- No date-range selector (hardcoded 6 months)
- No widget configuration (order, visibility, sizing)
- No favorites or pinned accounts
- No "hide sections" preference
- User greeting uses `displayName` or email — personal but shallow

### Empty States
- **Budgets:** Full `EmptyState` component with icon, title, description, and "Go to Budgets" CTA — well done
- **Transactions:** Inline text "No transactions match your search" in an empty table row — minimal but functional
- **Missing:** Empty state for charts when there are no transactions (recent user with zero data sees flat charts with zeroed axes)

### Loading States
- `PageSkeleton` with `sections={4}` renders as a placeholder while the lazy-loaded Dashboard module loads
- Skeleton mimics the card + chart layout shape — decent visual continuity
- **Missing:** Skeleton variants for zero-data or error states within already-loaded charts (individual chart-level loading)
- Charts render immediately with whatever data is available — if data loads asynchronously, charts flash from empty to populated

### Animations
- All animations use `framer-motion` with `initial={{ opacity: 0, y: 8 }}` / `animate={{ opacity: 1, y: 0 }}` — consistent
- Staggered delays (0, 0.1, 0.2) create a cascade effect
- StatCard has `whileHover={{ y: -4 }}` — subtle lift
- BudgetCard has `whileHover={{ y: -3 }}` — same pattern
- Sidebar active indicator uses `layoutId="sidebar-active"` — smooth animated indicator
- **Issue:** The `framer-motion` entrance animations fire on every mount; if the user navigates away and back (e.g., via sidebar), the full animation sequence replays rather than appearing settled

---

## Accessibility Review

### Passes
- Skip-to-main-content link (line 65–70 of AppLayout)
- `aria-label` on search inputs, filter selects, sort selects, pagination buttons, notification bell, theme toggle
- `aria-current="page"` on active sidebar link
- `role="status"` on PageSkeleton and EmptyState
- `role="progressbar"` with `aria-valuenow/min/max` on budget progress bars
- `aria-expanded` on budget insights toggle
- `focus-visible:ring-2` on all interactive elements
- Semantic heading hierarchy (`h1` page title, `h2` section titles, `h3` budget card titles)

### Fails / Gaps
1. **Chart interactivity** — Recharts SVG charts have no `aria-label` descriptions. The Income vs Expenses chart, Spending by Category chart, etc., are visual-only. Screen readers get an unstyled SVG element with no accessible label.
2. **Color-only differentiation** — StatCard variants use different gradient colors but no text label to distinguish income vs expense vs balance variants at the component level
3. **Tabular data without `tabular-nums`** — Transaction table and stat card values use proportional figures; columns of numbers don't align vertically
4. **Hover-only budget card actions** — The budget card kebab menu appears on hover; while it is focusable via tab, the affordance is visually hover-dependent
5. **No reduced-motion consideration** — `framer-motion` entrance animations fire regardless of `prefers-reduced-motion`
6. **Small chart description text** — `text-xs` (12px) for chart subtitles may fail WCAG SC 1.4.4 for users who need to zoom

---

## Mobile Review

### Breakpoints Tested
| Width | Behavior |
|---|---|
| 320px | Stat cards stack 1-col. Charts stack 1-col. Transaction table scrolls horizontally. Sidebar off-screen with hamburger. |
| 375px | Same as 320 — adequate layout. Header search hidden (hidden md:block). |
| 414px | Same pattern. Stat card values use compact formatting. |
| 768px | 2-col stat cards. Table shows date column. Sidebar is still off-screen (lg breakpoint). |

### Issues
1. **5 stat cards don't distribute evenly** — `sm:grid-cols-2` means the 5th card wraps alone on the second row at tablet widths
2. **Transaction table overflow** — uses `overflow-x-auto` on a `<div>` wrapper, which is correct, but the table has 5 columns with `px-5 py-3` padding, causing horizontal scroll at narrow widths even though 2 columns are hidden
3. **Stat card values overflow** — At 320px, a Naira value like "₦12,345,678" with compact formatting could still overflow the `font-display text-2xl sm:text-3xl` container
4. **No mobile-specific optimizations** — The page renders the same content at the same density regardless of viewport. Chart density is not reduced on mobile

---

## Performance Perception

### Load
- Dashboard is lazy-loaded via `React.lazy()` — good code splitting
- `PageSkeleton` renders immediately as suspense fallback — good perceived performance
- Recharts, Framer Motion, Lucide are all split into separate chunks via the lazy import boundary

### Render
- `useDashboardMetrics()` wraps all computations in `useMemo` — efficient
- `StatCard` is `memo()`-wrapped — avoids unnecessary re-renders
- Sparkline data and filtered transactions are memoized
- No obvious unnecessary re-renders in the component tree

### Concerns
- **5 charts on one page** means 5 Recharts SVG trees in the DOM simultaneously — this can be heavy on low-end devices, especially during entrance animations
- StatCard sparkline uses `<ResponsiveContainer>` for every card — each sparkline is a full Recharts `<AreaChart>` instance, adding 5 chart contexts beyond the main 5 charts
- **No virtualization** for the transaction table — with `pageSize=5` this is acceptable, but navigating pages causes full re-render

---

## Component Inventory

| Component | File | Lines | Props | Notes |
|---|---|---|---|---|
| StatCard | `src/components/dashboard/StatCard.tsx` | 86 | label, value, delta, icon, variant, data | Memoized, 5 variants, sparkline |
| PageHeader | `src/components/common/PageHeader.tsx` | 24 | title, subtitle, action | Memoized, motion entrance |
| EmptyState | `src/components/common/EmptyState.tsx` | 57 | icon, title, description, action, compact, children | Memoized, motion entrance |
| BudgetCard | `src/components/budgets/BudgetCard.tsx` | 217 | budget, metrics, onView/onEdit/onDelete | Heavy component with insights panel, progress bar, dropdown |
| PageSkeleton | `src/components/ui/PageSkeleton.tsx` | 54 | withHeader, withSidebar, sections | Loading placeholder |
| Sidebar | `src/components/layout/Sidebar.tsx` | 142 | collapsed, onToggle, mobileOpen, onMobileClose | Memoized, animated active indicator |
| AppLayout | `src/components/layout/AppLayout.tsx` | 186 | (via Outlet) | Sticky header, global search, notifications |

---

## Pain Points

1. **Chart redundancy** — Monthly Expenses line chart duplicates data already shown in Income vs Expenses bar chart (same `monthlyChart`, same `dataKey: "expenses"`)
2. **5-shade chromatic spread** — StatCard gradients (purple, green, red, blue, purple-violet) + 10-color pie palette + green/red chart bars = ~8 distinct hues on one page with no clear system
3. **Shadow-glow in dark mode** — `--shadow-md` and `--shadow-lg` reference light-color HSL values not overridden for `.dark`, producing a soft halo effect on dark cards
4. **No progressive disclosure** — All 10 sections are rendered at full weight; no collapsible sections, "show more" truncation, or tab-based grouping
5. **Scope ambiguity with Reports** — The `/reports` page is titled "Analytics Dashboard" and duplicates chart types (income vs expenses, category breakdown, cash flow), leaving users unsure which page serves what purpose
6. **No date-range controls** — The 6-month window is hardcoded; users cannot explore different periods without navigating to Reports
7. **Stat card sparklines too small** — `max-w-[120px]` at full width is only ~15 data points across ~120px; the trend line is visually meaningless
8. **Identical card styling** — Every section card uses `rounded-xl border border-border bg-card p-5 shadow-elegant`; nothing visually differentiates a primary metric from a secondary chart from a tertiary section

---

## Quick Wins

1. **Fix dark-mode shadows** — Override `--shadow-md` and `--shadow-lg` in `.dark` to use darker colors: `hsl(222 47% 4% / 0.5)` and `hsl(222 47% 0% / 0.6)`
2. **Remove redundant Monthly Expenses chart** — Replace the line chart with something else (e.g., top spending merchants, upcoming bills, upcoming savings goals) or fold it into the income vs expenses chart as an overlay
3. **Add `tabular-nums` to transaction table and stat values** — One CSS rule on the table and stat card value containers ensures vertical number alignment
4. **Add `prefers-reduced-motion` check** — Wrap `framer-motion` entrance animations: `const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches`
5. **Provide chart `aria-label` descriptions** — Each chart container should have an accessible label: `<div role="img" aria-label="Income vs expenses bar chart for the last 6 months">`
6. **Add empty-state fallback for charts** — When no transactions exist, show a centered "Add your first transaction to see charts" message instead of zeroed-out chart axes
7. **Merge `Cash Saved (Month)` and `Total Saved` cards** — These are the same metric at different time windows; combine into one card with a "this month / all time" toggle or rename for clarity

---

## Major Improvements

1. **Eliminate chart redundancy by consolidating the chart section** — Replace the current 4-chart+1-chart layout with a focused 3-chart structure: Income vs Expenses (bar, 6-month), Spending by Category (donut, top-5), and Cash Flow (area). Remove the duplicate Monthly Expenses line chart. Move Savings Contributions into the Budgets section or make it conditional when savings goals exist.
2. **Add a date-range picker** — Allow users to toggle between "Last 3 months / 6 months / 12 months / Custom range" directly on the dashboard. This eliminates the primary reason users would need to visit Reports for a time-series query.
3. **Introduce section density control** — Make Budgets and the transaction table collapsible (`data-state="open"` / `data-state="closed"` with persistent preference in localStorage or user settings). Let users choose what they see first.
4. **Re-theme stat cards for reduced chromatic spread** — Drop the 5-variant gradient backgrounds on icon boxes. Use a single consistent icon container style (e.g., `bg-primary/10 text-primary` for all) and differentiate metrics through value size, label text, and delta badge alone. Reserve gradient backgrounds for the most important card (Total Balance).
5. **Resolve scope ambiguity with Reports** — Either rename the Reports page title from "Analytics Dashboard" to "Reports & Analytics", or merge the dashboard's chart section into Reports and make the dashboard a purely metric-summary + quick-actions page with links to Reports for deeper analysis.

---

## Hallmark Recommendations

Using the Hallmark audit framework against the anti-pattern catalogue:

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Critical** | Shadow-glow on dark | `src/index.css:54-56` | `--shadow-md`/`--shadow-lg` not overridden in `.dark`, producing colored halo on dark surfaces | Add `.dark` overrides with dark-tinted shadow values |
| **Major** | Chart redundancy (data echo) | `Dashboard.tsx:157-175` | Monthly Expenses line chart duplicates `monthlyChart.expenses` data shown in Income vs Expenses bar chart | Remove or replace with differentiated content |
| **Major** | Chromatic spread | `Dashboard.tsx:21-25` + `StatCard.tsx:17-22` | 5 gradient variants + 10-color COLORS array + chart hues = ~8 competing accents on one page | Consolidate to 2–3 accent hues; drop per-variant gradients |
| **Major** | No progressive disclosure | `Dashboard.tsx` (entire page) | 10 sections, all visible, no collapse/show-more pattern | Add collapsible sections with preference persistence |
| **Major** | Scope ambiguity | `Dashboard.tsx:1` vs `Reports.tsx:256` | Reports page titles itself "Analytics Dashboard" and duplicates chart types | Re-name Reports or differentiate content |
| **Minor** | Inter-everywhere | `tailwind.config.ts:15-16` | Body (Inter) and display (Plus Jakarta Sans) are both geometric neo-grotesks with subtle difference | Acceptable pairing but consider a more distinct display face |
| **Minor** | Tabular data without `tabular-nums` | `Dashboard.tsx:300-339` | Transaction amounts and stat values use proportional figures | Add `font-variant-numeric: tabular-nums` to table and stat card values |
| **Minor** | Hover-only affordances | `BudgetCard.tsx:82-102` | Kebab menu visually appears on hover; accessible via tab but no mobile tap cue | Ensure touch targets are clearly indicated |
| **Minor** | Sparkline too small | `StatCard.tsx:64` | `max-w-[120px]` sparkline is too narrow for meaningful trend | Increase to `min-w-[160px]` or remove sparklines in favor of a single mini-chart |

### Hallmark Scorecard

| Category | Score | Notes |
|---|---|---|
| Philosophy | 3/5 | Template-quality ceiling; functional but not designed |
| Hierarchy | 3/5 | Sections exist but don't signal relative importance |
| Execution | 4/5 | Well-coded; clean components, good TypeScript |
| Specificity | 3/5 | Generic admin-dashboard aesthetic |
| Restraint | 3/5 | Too many charts, too many hues, no disclosure |
| Variety | 3/5 | Every section card is visually identical |

---

## Overall Dashboard Score

**6.2 / 10**

A solid functional dashboard that delivers core financial metrics but lacks the editorial curation and visual hierarchy that would elevate it from "admin template" to "product experience." The technical foundation is strong (typed, memoized, well-lazy-loaded), but the page-level orchestration — chart selection, information density, chromatic discipline, dark-mode polish — needs the structural editing that Hallmark's discipline provides.

**Fix the shadow-glow dark-mode issue first (critical), then address the chart redundancy and scope ambiguity (major), then introduce progressive disclosure (major).** The quick wins alone would move the score to ~7.5.
