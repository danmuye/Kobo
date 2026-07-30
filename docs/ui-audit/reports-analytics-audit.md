# Reports & Analytics UI/UX Audit

**Target:** `/reports` — `src/pages/Reports.tsx` (843 lines)
**Hook:** `src/features/reports/hooks.ts` (175 lines)
**Chart Components:** `ChartCard`, `ChartTooltip`, `CategoryChart`, `SavingsTrendChart`, `DebtBreakdownChart`, `AccountBalancesChart`, `CompletionForecastChart`
**Service:** `src/services/reports.ts` (533 lines) — date range, filtering, health score, trends, comparison, insights
**Export:** `src/services/export.ts` — CSV, Excel, PDF
**Date:** 2026-07-20

---

## Executive Summary

The Reports & Analytics page is Kobo's deepest analytical surface. It provides 8 Recharts charts, 4 summary KPI cards, 7 financial insight cards, a period-over-period comparison mode, 3 export formats (CSV/Excel/PDF), and drill-down sections for savings goals and budget utilization. The `useReportsPage` hook cleanly orchestrates date-range state, multi-dimensional filtering, memoized report computation, and export dispatch. The `computeReport` service is well-structured with typed interfaces and defensive null-handling.

Three structural issues prevent this from being a great analytics page: **(1) it is a single-stack firehose** — 11 sections with no progressive disclosure, no collapsible panels, no tabbed view; **(2) the information hierarchy is inverted** — the Financial Insights section (7 secondary cards with trend directions and goal growth) renders _above_ the summary KPI cards (Total Income, Total Expenses, Net Cash Flow), so users must scroll past tertiary analysis to reach primary metrics; **(3) scope ambiguity with the Dashboard** — the page is titled "Analytics Dashboard", replicating several chart types (Income vs Expenses, Spending by Category, Cash Flow) already on the Dashboard, with no clear differentiation in purpose or audience.

**Verdict:** Deep analytical engine wrapped in a firehose UI. The computation layer is robust; the presentation layer lacks editorial curation, progressive disclosure, and a clear identity distinct from the Dashboard.

---

## UI Review

### Page Layout & Structure
- 11 sections in a single vertical stack: PageHeader → Filter Bar → Comparison Banner → Financial Insights (7 cards) → KPI Cards (4) → Charts Grid (8) → Savings Analytics (4 cards) → Goal Completion Forecast → Projected Completion Timeline → Savings Goals Progress → Budget Utilization
- Every section uses `rounded-xl border bg-card p-5 shadow-elegant` — identical card styling
- No collapsible sections, tabbed views, or "show more" toggles
- Page is ~3+ viewports tall on a 1920×1080 display

### Financial Insights Section
- 7 items in a `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` grid
- Health Score gauge: SVG ring with `strokeDasharray` animation, 5-tier coloring, embedded mini progress bar
- Highest Spending Category: name, amount, percentage of total expenses
- Largest Expense: formatted amount, description, date
- Fastest Growing Goal: name, monthly rate, completion percentage
- Budget Overspending: count, total overspent, overspent budget names
- Spending Trend / Income Trend: TrendIndicator with direction (Up/Down/Stable) + period total
- **Placed above the KPI cards** — users see trend analysis before they see primary income/expense totals

### Summary KPI Cards
- 4 cards in `grid-cols-2 lg:grid-cols-4`: Total Income, Total Expenses, Net Cash Flow, Account Balance
- Each card: icon box, label, value (truncated), optional comparison delta
- Color-coded icon backgrounds: green for income, red for expenses, conditional for cash flow, primary for balance
- Comparison badge: `PctBadge` with arrow icon + percentage, "vs previous period" label
- **Comparison is indexed by position** — `comparison.entries[0]` mapped to Income, `[1]` to Expenses, `[2]` to Cash Flow — fragile; no named access

### Charts Grid
- 8 charts in a `grid-cols-1 lg:grid-cols-2` layout (4 rows of 2)
- ChartCard wrapper: title, subtitle, headingLevel prop, loading skeleton, empty state with message
- Charts: Income vs Expenses (grouped bar), Monthly Spending Trend (line), Cash Flow (area), Budget Performance (horizontal bar), Savings Growth (area), Debt Breakdown (horizontal bar), Spending by Category (donut), Account Balances (horizontal bar)
- **Monthly Spending Trend line chart duplicates data** — the line chart at line 570 renders `report.monthlyChart` with `dataKey="expenses"`, which is the exact same data series shown as the red bars in the Income vs Expenses bar chart (line 556, `dataKey="expenses"`). Same data, same column, two chart types.
- Chart colors: hardcoded HSL values throughout — `hsl(142 71% 45%)` for income, `hsl(0 72% 55%)` for expenses, `hsl(217 91% 60%)` for budget, `hsl(159 64% 45%)` for cash flow — token drift risk
- CategoryChart uses an 8-color COLORS array — overlapping with but not derived from theme tokens
- Animated chart entrance: `animationBegin` stagger (0, 150ms) and `animationDuration` (600-800ms)

### Filters
- Category, Account, Type selects in a horizontal bar with `FilterSelect` component
- All filters are single-select only — can choose one category, one account, one type at a time
- "Clear" button shows active filter count (number of dimensions filtered, not total selections)
- **No budget filter UI** — `FilterState` includes `budgetIds[]` and `filterOptions` includes `budgets`, but there is no FilterSelect for budgets in the filter bar
- No search/typeahead within filter dropdowns
- Filter options derived from transactions (dynamic), sorted alphabetically

### Date Range Picker
- Tab-style radio group: Today / Week / Month / Year / Custom
- Custom reveals two date inputs with "to" separator
- No "Last 3 Months", "Last 6 Months", "Last 12 Months" presets — only Year covers large windows
- No quarter-based presets (This Quarter, Last Quarter)
- Date inputs are unstyled native `<input type="date">` — inconsistent with the app's design language

### Comparison Mode
- Toggle button with `aria-pressed`, transforms from outline to secondary variant
- Comparison banner slides in with animation: 3-column grid of Income / Expenses / Net Cash Flow vs previous period
- Each card: current value, "vs {previous}" label, percentage change, directional arrow, "good"/"bad" semantic label
- Empty state when no comparison data exists
- Comparison is only for Income/Expenses/Cash Flow — no budget, goal, or debt comparison

### Export Experience
- Three icon-only buttons in the filter bar: CSV (Table2 icon), Excel (BarChart3 icon), PDF (FileText icon)
- No text labels — relies on `aria-label` for discoverability
- Exports only the filtered transaction list (not charts, insights, KPIs, or the report summary)
- PDF export opens in new tab/window ("PDF report opened" notification)
- No export options dialog (no format-specific choices, no column selection, no date range confirmation)
- Export dispatches `notify.success` on completion — lightweight feedback

### Savings & Goal Sections
- Savings Analytics: 4 summary cards (Active Goals, Avg Monthly Savings, Total Saved, Projected Completion)
- Goal Completion Forecast: hybrid layout — CompletionForecastChart (horizontal stacked bars) + per-goal cards with status badges
- Projected Completion Timeline: conditional area chart with target line (shown only when forecast data exists)
- Savings Goals Progress: per-goal cards with progress bar, badge, metrics (grid-cols-3)

### Budget Utilization
- Conditional section (shown only when budgets exist)
- Overall utilization: label with spent/budgeted/percentage
- Per-budget cards: 3-column grid, name + percentage, progress bar (3-tier coloring), spent/budgeted values

---

## UX Review

### User Workflows
1. **Page → Select date range** — presets or custom dates at top of page
2. **Page → Filter by category/account/type** — single-select dropdowns in filter bar
3. **Page → Read financial insights** — health score, trends, overspending (top of content)
4. **Page → Read KPIs** — income, expenses, cash flow, balance (below insights)
5. **Page → Explore charts** — 8 charts in 2-column grid (below KPIs)
6. **Page → Compare periods** — toggle comparison mode, read delta banner
7. **Page → Export** — icon-only buttons in filter bar
8. **Page → Read savings, goals, budgets** — drill-down sections at the bottom

### Discoverability
- Date range picker is the first interactive element — well-placed
- Filters are in a dedicated bar below the header — expected location
- Compare button lives in the filter bar — same row as export, which is appropriate
- Export buttons are icon-only with no label text — users may miss them
- Comparison mode is a toggle, not a paired date picker — discoverable but the UX of "enter comparison mode → see deltas" is clean
- No link to the Dashboard or any cross-navigation between the two analytics surfaces

### Information Hierarchy Problems
1. **Insights above KPIs** — Financial Insights (trends, largest expense, fastest-growing goal) are secondary analytical outputs that should follow, not precede, the summary KPI cards
2. **No sense of page** — 11 equally-weighted sections in identical card styles; no visual differentiation between primary metrics (KPIs), secondary analysis (insights), tertiary exploration (charts), and quaternary detail (goal progress, budget utilization)
3. **Dashboard overlap** — The page re-renders Income vs Expenses (bar), Spending by Category (donut), and Cash Flow (area) — all chart types that also appear on the Dashboard. A user landing on `/reports` sees the same chart shapes with an arguably weaker context (the Dashboard adds stat cards, sparklines, and budget cards above the fold)

### Empty States
- ChartCard: centered icon + "No transactions in this period." / "No budgets configured." / "No savings contributions yet." / "No debts recorded." / "No accounts created." / "No expenses in this period."
- Comparison: "No comparison data available for this period."
- Goal cards: "No savings goals yet."
- Insights: "No expenses recorded" / "No savings goals" for individual insight cards

### Loading States
- Chart-level `loading` prop driven by a `mounted` flag — charts show a Skeleton placeholder until the component mounts
- No page-level loading skeleton
- No loading state for the `useReportsPage` hook (computation is synchronous via `useMemo`)

---

## Accessibility Review

### Passes
- `role="group"` and `aria-label` on date range picker and export button group
- `aria-pressed` on date range tab buttons and comparison toggle
- `aria-label` on export buttons ("Export CSV", "Export Excel", "Export PDF")
- `aria-label` on custom date inputs ("Start date", "End date")
- `aria-hidden` on decorative icons (Filter, Star, TrendDownIcon, etc.)
- `headingLevel="h2"` prop on ChartCard for proper heading hierarchy within sections
- `focus-visible:ring-2` on all interactive elements

### Fails / Gaps
1. **Chart SVGs lack accessible labels** — Every Recharts chart renders an unstyled SVG with no `role="img"` or `aria-label`. Screen readers encounter silent, untagged SVG elements.
2. **No `tabular-nums` on KPI values** — Amounts in KPI cards, insight cards, and metric labels use proportional figures; columns of numbers don't align vertically.
3. **Color-only differentiation** — KPI card icon backgrounds (green/red/primary) are the only visual indicator of metric type; health score uses color-only tiering (text-success / text-warning / etc.).
4. **Icon-only export buttons** — Three buttons in a row with no visible label text; while `aria-label` is present, sighted users rely on icon recognition alone.
5. **No `prefers-reduced-motion`** — Framer Motion entrance animations on insights, KPIs, charts, and comparison banner all fire regardless of user preference.
6. **Small font sizes** — `text-xs` (12px) for card labels and `text-[10px]` for secondary labels (`"vs previous period"`, `"good"`/`"bad"` semantic indicators) may fail WCAG SC 1.4.4.
7. **FilterSelect component not labeled** — The `<Label>` element is a `<span>` with `text-xs text-muted-foreground`, not associated via `htmlFor`/`id` or `aria-labelledby`.

---

## Mobile Review

### Breakpoints
| Width | Behavior |
|---|---|
| 320px | Filter bar wraps to 2-3 rows. KPI cards 2-col. Charts stack 1-col. Date range buttons compact but usable. |
| 375px | Same as 320 — adequate. Filter bar fits 2 rows. Insights grid 2-col. |
| 414px | Better layout, filter bar fits 1-2 rows. |
| 768px | Insights grid 2-col. KPI cards 2-col. Charts 1-col (lg breakpoint not reached). |

### Issues
1. **Filter bar overflow** — At 320px, the filter bar packs Category, Account, Type selects + Compare button + export buttons + Clear button into a single `flex-wrap` row. The small selects (`h-7`, `min-w-[100px]`) can overflow or cause awkward wrapping with 5+ elements.
2. **No mobile-specific chart treatment** — Charts render at the same size and density regardless of viewport; no simplified mobile chart variant.
3. **Date range preset buttons** — 5 buttons in a row (`flex-wrap`) push the custom date inputs to a new line, causing the PageHeader action area to stack vertically.
4. **No sticky filter bar** — As users scroll through 3+ viewports of content, the filter bar scrolls off-screen; there's no way to adjust filters without scrolling back to the top.

---

## Performance Perception

### Load
- Page is lazy-loaded via `React.lazy()` in App.tsx — good code splitting
- No page-level loading skeleton — brief flash of empty container
- All report computation is synchronous in `useMemo` — fast for moderate datasets but can block the main thread with thousands of transactions

### Render
- All chart data is memoized with proper dependencies
- CategoryChart, SavingsTrendChart, ChartCard, ChartTooltip are `memo()`-wrapped
- Filters trigger full recomputation of `report` and `insights` via `useMemo`
- `mounted` state (line 192-193) is a `useState` + `useEffect` pattern — adds one unnecessary re-render

### Concerns
- **8 Recharts SVGs in the DOM simultaneously** — 8 chart contexts with CartesianGrid, XAxis, YAxis, Tooltip, and Legend each; significant DOM weight on low-end devices
- **Full recomputation on any filter change** — `report`, `insights`, and `comparison` all recompute with updated `filteredTransactions`; no incremental computation
- **Goal completion forecast and overall timeline** computed via store functions that iterate all goals and transactions — recomputed on every transaction change
- **No virtualization** for goal cards or budget cards — acceptable for typical counts (<50 goals, <50 budgets)

---

## Component Inventory

| Component | File | Lines | Props | Notes |
|---|---|---|---|---|
| Reports (page) | `src/pages/Reports.tsx` | 843 | — | 11 sections, inline KpiCard/PctBadge/TrendIndicator/FilterSelect components |
| useReportsPage | `src/features/reports/hooks.ts` | 175 | — | Date range, filters, report compute, comparison, export |
| ChartCard | `src/components/charts/ChartCard.tsx` | 65 | title, subtitle, action, loading, empty, emptyMessage, children, headingLevel | Memoized, skeleton+empty states |
| ChartTooltip | `src/components/charts/ChartTooltip.tsx` | 33 | active, payload, label, formatter, labelFormatter | Memoized, inline styles |
| CategoryChart | `src/components/charts/CategoryChart.tsx` | 51 | data, height | Memoized, 8-color palette, donut |
| SavingsTrendChart | `src/components/charts/SavingsTrendChart.tsx` | 49 | data, height, showArea | Memoized, area or line |
| DebtBreakdownChart | `src/components/charts/DebtBreakdownChart.tsx` | — | data, height | Horizontal stacked bar |
| AccountBalancesChart | `src/components/charts/AccountBalancesChart.tsx` | — | data, height | Horizontal bar |
| CompletionForecastChart | `src/components/charts/CompletionForecastChart.tsx` | — | data, height | Horizontal stacked bar |
| computeReport | `src/services/reports.ts` | 533 | — | Date range, income/expenses, savings, budgets, debts, account balances, monthly chart, category breakdown |

---

## Pain Points

1. **Inverted information hierarchy** — Financial Insights (7 secondary analytics cards) renders above the summary KPI cards. Users see trend analysis and goal growth before they see total income, expenses, and cash flow.
2. **Firehose layout** — 11 sections in a single vertical stack with no collapsible panels, tabs, or progressive disclosure. Identical card styling gives no visual weight differentiation between primary and tertiary content.
3. **Chart redundancy with Dashboard** — Three chart types (Income vs Expenses, Spending by Category, Cash Flow) appear on both pages. The Reports page also duplicates the Monthly Spending Trend line chart _within itself_ — it's the same `dataKey="expenses"` data already shown as red bars in the Income vs Expenses chart.
4. **Scope ambiguity** — Page title is "Analytics Dashboard", which overlaps confusingly with the Dashboard page. Users must navigate to both pages to understand which serves what purpose.
5. **Single-select filters** — Category, Account, and Type filters only allow one value at a time; no multi-select, no search, no typeahead.
6. **Icon-only export buttons** — No text labels on export (CSV, Excel, PDF) buttons; relies entirely on small Lucide icons and aria-labels for discoverability.
7. **Export scope is too narrow** — Only the filtered transaction list is exported; charts, insights, KPIs, and the comparison summary are excluded.
8. **No budget filter UI** — `budgetIds` is defined in `FilterState` and `filterOptions.budgets` is computed, but no FilterSelect for budgets appears in the filter bar.
9. **Hardcoded chart colors** — HSL strings scattered across Reports.tsx (lines 564-565, 578, 597, 610-611) and chart components — token drift risk.
10. **Charts inaccessible to screen readers** — All 8 Recharts SVGs lack `role="img"` and `aria-label`.
11. **No `tabular-nums`** — KPI values, metric amounts, and chart tooltip values use proportional figures.

---

## Quick Wins

1. **Add `tabular-nums` to KPI values and metric labels** — One CSS class on value spans ensures vertical number alignment.
2. **Move Financial Insights below KPI cards** — Swap the order of the insights section (line 404) and the KPI cards section (line 523). The primary summary should come first.
3. **Add chart `aria-label` descriptions** — Each chart container needs `role="img"` and `aria-label="Income vs expenses bar chart for {period}"`.
4. **Add `prefers-reduced-motion` check** — Conditionally skip Framer Motion entrance animations on insights, KPIs, charts, and comparison banner.
5. **Remove redundant Monthly Spending Trend line chart** — The line chart at line 570 duplicates `dataKey="expenses"` already shown in the Income vs Expenses bar chart. Replace it with a differentiated chart (e.g., top merchants, payment methods) or remove it.
6. **Add text labels to export buttons** — Add "CSV", "Excel", "PDF" text alongside the icons, or add visible tooltips.

---

## Major Improvements

1. **Fix the information hierarchy** — Reorder the page: PageHeader → Filter Bar → KPI Cards → Comparison Banner → Financial Insights → Charts Grid → Goal/Budget drill-down sections. The primary summary (KPIs) must precede secondary analysis (insights).
2. **Introduce progressive disclosure** — Add collapsible sections for the charts grid, savings analytics, goal forecast, and budget utilization. Default the most important sections (KPIs, insights, 4 core charts) open; collapse secondary drill-downs.
3. **Resolve scope ambiguity with the Dashboard** — Either rename the Reports page to something distinct (e.g., "Reports & Analytics") or differentiate the chart selection so Reports focuses on period-over-period trends, forecasts, and comparison while the Dashboard focuses on current-state snapshots. Remove the duplicate chart types.
4. **Add multi-select filters** — Replace single-select dropdowns with multi-select comboboxes or checkbox dropdowns, allowing users to filter by multiple categories, accounts, and types simultaneously.
5. **Widen export scope** — Allow exporting of the full report (KPIs, insights, charts as images, transaction list) not just the raw transaction data. Add an export dialog with format and content options.
6. **Add budget filter UI** — Wire up the existing `filterOptions.budgets` to a FilterSelect in the filter bar.
7. **Consolidate chart colors with theme tokens** — Replace all hardcoded HSL strings (`hsl(142 71% 45%)`, `hsl(0 72% 55%)`, etc.) with references to CSS custom properties via a centralized chart color constants object.

---

## Hallmark Recommendations

Using the Hallmark audit framework against the anti-pattern catalogue:

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Critical** | Chart redundancy (data echo) | `Reports.tsx:570-581` | Monthly Spending Trend line chart duplicates `dataKey="expenses"` already shown in Income vs Expenses bar chart (line 564) | Remove or replace with differentiated content |
| **Major** | Inverted hierarchy | `Reports.tsx:404-521` vs `523-552` | Financial Insights (tertiary analysis) renders above KPI cards (primary summary) | Swap section order |
| **Major** | No progressive disclosure | `Reports.tsx` (entire page) | 11 sections, all visible, no collapse/show-more pattern | Add collapsible sections with preference persistence |
| **Major** | Scope ambiguity | `Reports.tsx:256` | Page titles itself "Analytics Dashboard" and duplicates chart types from Dashboard | Rename and differentiate chart selection |
| **Minor** | Token drift | `Reports.tsx:564-565, 578, 597, 610-611` + chart components | Chart fills use raw HSL strings not derived from CSS custom properties | Centralize into theme-derived constants |
| **Minor** | Single-select filters | `Reports.tsx:289-323` | Category, Account, Type filters only allow one value at a time | Upgrade to multi-select |
| **Minor** | Icon-only actions | `Reports.tsx:346-358` | Export buttons have no text label, only aria-label | Add visible labels or tooltips |
| **Minor** | No `tabular-nums` | `Reports.tsx:128-129` and throughout | KPI values and metric amounts use proportional figures | Add `tabular-nums` class |
| **Minor** | No `prefers-reduced-motion` | `Reports.tsx:283-284, 405-406, 524-525` | Entrance animations ignore user preference | Add motion query check |
| **Minor** | Chart accessibility | `Reports.tsx:556-631` | All 8 Recharts SVGs have no aria-labels | Add `role="img"` + `aria-label` |

### Hallmark Scorecard

| Category | Score | Notes |
|---|---|---|
| Philosophy | 4/5 | Deep analytical engine with genuine utility |
| Hierarchy | 2/5 | Inverted order (insights above KPIs), no section weight differentiation |
| Execution | 4/5 | Well-hooked, typed, memoized, defensive null-handling in services |
| Specificity | 3/5 | Too chart-heavy without editorial curation; ambiguous identity vs Dashboard |
| Restraint | 2/5 | 11 sections, 8 charts, no disclosure — maximum density, minimum curation |
| Variety | 3/5 | Identical card styling across all sections; no structural differentiation |

---

## Overall Score

**6.0 / 10**

The Reports & Analytics page has the strongest computational foundation in Kobo — `computeReport`, `computeFinancialInsights`, `computeComparison`, `computeHealthScore`, and the `useReportsPage` hook form a mature analytical engine with typed interfaces, defensive coding, and clean memoization.

But the presentation layer undermines that engine. The page is a firehose: 11 sections stacked vertically with no curation, no disclosure, and no visual differentiation between a primary KPI and a secondary insight card. The information hierarchy is inverted — trend analysis appears before the summary numbers it's analyzing. Three chart types duplicate the Dashboard, and one chart (Monthly Spending Trend) duplicates data already visible in the chart next to it. The page calls itself "Analytics Dashboard", which gives users no reason to visit both pages.

**Fix the hierarchy (move KPIs above insights) and the chart redundancy (remove the duplicate line chart) for immediate clarity wins. Then introduce progressive disclosure and differentiate the page's identity from the Dashboard.** These changes alone would move the score to ~7.5.
