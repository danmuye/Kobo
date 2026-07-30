# Budgets Module UI/UX Audit

**Target:** `/budgets` — `src/pages/Budgets.tsx`
**Components:** `BudgetCard` (217 lines), `BudgetInsightsPanel` (150 lines), `BudgetAnalyticsPanel` (194 lines), `BudgetHistoryTimeline` (103 lines), `BudgetComparison` (104 lines), `EmptyBudgetState` (32 lines)
**Services:** `budget-matching.ts` (362 lines) — metrics, insights, analytics, period range, matching engine
**Date:** 2026-07-20

---

## Executive Summary

The Budgets module is the most analytically mature page in Kobo. The service layer (`budget-matching.ts`) provides sophisticated metrics, forecasts, trends, daily allowances, and cross-period analytics. The UI exposes a tabbed detail dialog (Transactions / Insights / Analytics / History) per budget, an overall utilization bar, and a card/summary view toggle. The integration with transactions (via `budgetId`) is clean and functional.

However, the module has three specific craft issues: **(1) a stored-but-unused `color` field** — the ColorPicker in the form sets a value that no UI component ever renders; **(2) an icon-system fracture** — the card view uses Lucide SVG icons via `iconMap` while the summary view uses hardcoded emoji (🍔🚗🏠⚡); **(3) an unwired `BudgetComparison` component** — 104 lines of period-over-period comparison logic that appears nowhere in the UI. The budget form also lacks the "Recent" convenience pattern that the transaction form provides.

**Verdict:** Functionally rich, analytically deep, held back by icon inconsistency, an orphaned color field, and a comparison component waiting for a home.

---

## UI Review

### Budget Cards
- Lucide icon in a rounded box, name (truncated), period + categories, status badge (On Track / Near Limit / Exceeded)
- Progress bar with animated fill, shimmer overlay, exceeded overflow indicator
- Spent amount (large, animated) vs budget amount, percentage used, remaining/overspent
- Stats summary box: Spent, Transactions, Daily Avg, Status — 4 rows in a bordered container
- Insights toggle button at the bottom expands inline `BudgetInsightsPanel`
- Kebab dropdown: View Transactions, Show/Hide Insights, Edit Budget, Delete Budget
- The bottom "Show insights" button duplicates the dropdown's "Show Insights" menu item — two entry points to the same toggle

### Progress Indicators
- Three-tier color: green (`bg-success`), yellow (`bg-warning`), red (`bg-destructive`)
- Animated width fill (`duration: 0.9, ease: "easeOut"`)
- Exceeded budgets: red top-border accent line (`h-1 bg-destructive`) plus right-side overflow indicator (`bg-destructive/40 border-l-2 border-destructive`)
- Shimmer gradient animation on the progress bar fill — decorative, may be perceived as slow loading
- Overall utilization bar on the main page uses the same three-tier coloring with animated fill

### Budget Creation
- Dialog form: name, category (dropdown), icon (dropdown of name strings), amount, period (Weekly/Monthly/Yearly/Custom), date range (in `<details>` disclosure), accounts/wallets/tags (CSV inputs), notes, color (ColorPicker)
- Uses `react-hook-form` + `zodResolver` with `budgetSchema`
- **No "Recent" convenience** — unlike the transaction form, the budget form doesn't surface recently-used categories or values
- **Icon selector is a text dropdown** showing strings like `"food"`, `"transport"` — users must know the icon key; no visual preview
- **Color field renders but is unused in UI** — the ColorPicker sets `budget.color`, the value is persisted, but no component (BudgetCard, summary view, detail dialog) ever reads or displays it

### Edit Dialog
- Same dialog as creation, pre-filled via `budgetToFormValues()`
- Correctly converts arrays back to CSV strings for accounts, wallets, tags

### Budget Details (BudgetOverview dialog)
- Full-width dialog (`sm:max-w-3xl`) with 4 summary stat boxes: Budget, Spent, Remaining, Transactions
- Over-budget warning banner when applicable
- 4-tab interface: Transactions, Insights, Analytics, History
- Each tab renders a dedicated sub-component
- **Tab icons** — Transactions and History both use `History` icon; no differentiation
- **Utilization metric in Analytics tab** shows ALL budgets' utilization, not the current budget's — potentially confusing

### Transaction Relationship
- Filtered via `getMatchingBudgetTransactions()`: matches by `budgetId`, date range, accounts, wallets, tags
- Transaction form integrates budget selection contextual to the selected category
- Budget detail shows matching transactions in a clean table

### Analytics (BudgetAnalyticsPanel)
- 4 stat cards: Budget Utilization, Available to Spend, Average Transaction, Largest Transaction
- Top Spending Categories section with per-category progress bars
- Daily Spend Trend mini-bar chart (last 14 days, rotated labels)
- Uses `getBudgetAnalytics()` from budget-matching service
- Well-implemented with staggered entrance animations

### Summary Cards
- "Overall Budget Utilization" card at page top: percentage, total budgeted/spent/remaining, progress bar
- Summary view toggle: collapses budget cards into compact horizontal rows with inline metrics and micro progress bars
- The summary rows use the same three-tier color coding
- **Summary view uses emoji icons** (🍔🚗🏠⚡▶️🛍️❤️👥📚🏥💰) while card view uses Lucide SVG icons — inconsistent

### Color System
- `Budget` type includes a `color` field with no visible effect anywhere in the UI
- The three-tier status system (success/warning/destructive) is the de facto color system
- No per-budget accent color differentiation in any view (card, summary, detail dialog tabs)

### Icons
- Card view: `iconMap` (Lucide) — 10 icons: `Utensils`, `Bus`, `Home`, `Zap`, `Play`, `ShoppingBag`, `Heart`, `Users`, `GraduationCap`, `Stethoscope`
- Summary view: hardcoded emoji strings — 10 emoji keys + `💰` fallback
- Form: text-based `<select>` showing icon name strings
- **Three different icon representations for the same concept** — Lucide SVGs in cards, emoji in summary, text names in the form

### Empty States
- `EmptyBudgetState.tsx` — PiggyBank icon, heading, description, "Create your first budget" CTA button
- Uses framer-motion entrance, `role="status"`, `aria-label`
- Well-implemented and consistent with the app's `EmptyState` pattern

---

## UX Review

### Overall Workflow
1. User arrives → sees either card grid or empty state
2. Creates budget → form dialog → validates → saves → card appears in grid
3. Views budget → clicks "View" or kebab → View Transactions → detail dialog with 4 tabs
4. Edits → kebab → Edit → pre-filled form → saves
5. Deletes → kebab → Delete → ConfirmDialog → confirms → removed
6. Archives → button on card (if period ended) → period saved to history
7. Toggles view → "Summary" / "Cards" button changes between card grid and compact rows
8. Cross-references → transaction form shows budget selector filtered by category

### Workflow Gaps
1. **No way to duplicate a budget** — must manually recreate with identical values
2. **No bulk archive** — must archive each budget period individually
3. **No rollover / carry-over** — unused budget doesn't flow to next period
4. **No budget comparison in the UI** — `BudgetComparison` component (104 lines) has `improvement`/`decline`/`stable` trend detection but never renders anywhere
5. **No visual budget calendar** — no way to see when budget periods overlap or what's coming up next

### Discoverability
- Card/summary view toggle is in the page header — visible but the label toggles between "Summary" and "Cards" which may not be self-explanatory
- Insights toggle is discoverable via both the kebab menu and the bottom button
- Archive button only shows inside the detail dialog's History tab — hidden
- The color picker is in the form but its effect is invisible — users may wonder what it does

### Information Architecture
- `BudgetOverview` dialog at ~135 lines inline in `Budgets.tsx` — should be extracted to its own component
- The page manages 5 pieces of state: `open`, `deleteConfirm`, `transactionsOpen`, `editing`, `isSubmitting`, `summaryView` — manageable but crowded
- The `BudgetOverview` component calls `computeBudgetUtilization(allBudgets, transactions)` showing overall utilization metrics inside a single budget's detail dialog — scope confusion

### Budget Form UX
- **Comma-separated inputs** for accounts, wallets, tags — same CSV pattern as transactions with the same weaknesses (no chip-style input, no validation feedback on individual entries)
- **Icon dropdown lists text names** — users must know "bolt" = Zap icon, "bag" = ShoppingBag icon; no visual preview
- **Color picker sets a value that nothing reads** — this will confuse users who set a color and see no change
- `<details>` disclosure hides "Date range & filters" — keeps the form clean but the CSV inputs inside feel buried

---

## Accessibility Review

### Passes
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` on progress bars
- `aria-expanded` on insights toggle button
- `aria-label` on action buttons (kebab menu, pagination)
- `role="status"` and `aria-label` on EmptyBudgetState
- Focus-visible rings on all interactive elements
- `aria-pressed` on tab-style selectors
- Radix-based `Dialog`, `AlertDialog`, `DropdownMenu` provide proper focus trapping, ARIA, and keyboard interaction

### Fails / Gaps
1. **No icon labels in summary view** — emoji icons (🍔🚗🏠) are used without `aria-hidden="true"` or accessible labels; screen readers will announce "hamburger" "red car" "house" unexpectedly
2. **`tabular-nums` absent** — budget amounts in cards, summary view, and detail dialog use proportional figures; columns of numbers don't align
3. **No `prefers-reduced-motion`** — framer-motion entrance animations, animated progress bars, and staggered reveals fire regardless of user motion preference
4. **Color-only status differentiation** — status is conveyed solely through green/yellow/red coloring; no text alternative for the three-tier system beyond the badge label (which is only on the card, not the progress bar itself)
5. **Small touch targets in summary view** — "View" and "Edit" buttons use `Button size="sm" variant="ghost"` with `text-xs` — small tap targets on mobile
6. **No `aria-sort` on transaction table** in the budget detail dialog

---

## Mobile Review

| Element | Behavior at 375px |
|---|---|
| Card grid | 1 column |
| Summary view | Vertical stack, metrics wrap |
| Overall utilization bar | Full width, stats wrap |
| Budget detail dialog | Full width with scroll |
| Form dialog | Full width with scroll |
| Form date range section | 2-col grid collapses to 1-col |

- Stat boxes in BudgetOverview collapse from 4-col to 2-col — acceptable
- The form's `<details>` disclosure for date range works well on mobile
- No mobile-specific optimizations beyond responsive grid collapse

---

## Animations

- Card entrance: `initial={{ opacity: 0, y: 12 }}` with framer-motion `layout`
- Card hover: `whileHover={{ y: -3 }}` — subtle lift
- Progress bars: animated width fill (0.9s easeOut) with shimmer
- Stat cards: staggered entrance (0.05s delay increments)
- Insights panel: `AnimatePresence` with height/opacity animation
- Daily trend bars: staggered height animation
- **No scroll-triggered animations** — all fire on mount, which is correct

---

## Component Inventory

| Component | File | Lines | Notes |
|---|---|---|---|
| Budgets (page) | `src/pages/Budgets.tsx` | 458 | Main page, form dialog, overview dialog inline |
| BudgetCard | `src/components/budgets/BudgetCard.tsx` | 217 | Full card with progress, insights toggle, dropdown |
| BudgetInsightsPanel | `src/components/budgets/BudgetInsightsPanel.tsx` | 150 | Forecast insights, daily allowance, compact mode |
| BudgetAnalyticsPanel | `src/components/budgets/BudgetAnalyticsPanel.tsx` | 194 | Utilization, categories, daily trend mini-chart |
| BudgetHistoryTimeline | `src/components/budgets/BudgetHistoryTimeline.tsx` | 103 | Archived periods timeline |
| BudgetComparison | `src/components/budgets/BudgetComparison.tsx` | 104 | Period-over-period trend — **not wired into UI** |
| EmptyBudgetState | `src/components/budgets/EmptyBudgetState.tsx` | 32 | Clean empty state with CTA |
| useBudgetsPage | `src/features/budgets/hooks.ts` | 95 | Metrics, insights, CRUD, archive |
| budget-matching | `src/services/budget-matching.ts` | 362 | Metrics, insights, analytics, period range, matching, utilization |

---

## Pain Points

1. **Color field stored but never rendered** — `Budget.color` is set via ColorPicker, persisted in the store and backend, but no UI component (BudgetCard, summary view, detail dialog) reads it. This is dead UI: the user picks a color, sees no result, and is left confused.
2. **Icon system fracture** — Lucide SVGs in card view, hardcoded emoji in summary view, text name strings in the form. Three representations for the same 10 icons.
3. **`BudgetComparison` is unwired** — 104 lines of period-over-period comparison (trend detection, percentage deltas, previous-period summaries) with no integration point in the UI.
4. **Budget detail dialog inlined in page component** — `BudgetOverview` at lines 53–188 of `Budgets.tsx` should be extracted to `components/budgets/`.
5. **Same-table icons in tab bar** — "Transactions" and "History" tabs both use the `History` icon, providing no visual differentiation.
6. **Overall utilization shown inside single-budget detail** — `BudgetOverview` calls `computeBudgetUtilization(allBudgets, transactions)` but the dialog is about one budget; the utilization shown is for all budgets, which is disorienting.
7. **CSV inputs for accounts, wallets, tags** — same pattern as transactions: no chip-style input, no validation feedback per entry.
8. **No budget duplication** — users who want similar budgets must manually re-enter all fields.
9. **`getBudgetStatus` threshold overlap** — lines 33–36: both `percentage >= 90` and `percentage >= 70` return `"Near Limit"`, meaning 70–89% also shows "Near Limit". This flattens the warning range into a single tier.
10. **No date-range filter on the budget list** — users can't view budgets by a specific month or quarter.

---

## Quick Wins

1. **Render `budget.color` in BudgetCard** — Use the budget's `color` field as the icon box background tint or a left-edge accent bar. This makes the ColorPicker meaningful.
2. **Replace summary view emoji with Lucide icons** — Use the same `iconMap` from `BudgetCard.tsx` in the summary view rows, rendered as `<Icon className="h-5 w-5" />` instead of emoji strings.
3. **Extract `BudgetOverview` to its own file** — Move `BudgetOverview` (lines 53–188) from `Budgets.tsx` to `src/components/budgets/BudgetOverviewDialog.tsx`.
4. **Add `aria-hidden="true"` to emoji icons** — If emoji must remain (short-term), wrap them in `<span aria-hidden="true">` to prevent screen reader confusion.
5. **Add `tabular-nums` to budget amounts** — One CSS rule on card amount containers and stat boxes ensures number alignment.
6. **Differentiate tab icons** — Use distinct icons for the History tab (e.g., `Clock` instead of `History`).
7. **Fix `getBudgetStatus` threshold** — Adjust so 70–89% is a distinct range, or add a fourth tier (e.g., "Caution" at 70–89%).

---

## Long-Term Improvements

1. **Wire `BudgetComparison` into the UI** — Add a "vs last period" chip or stat to BudgetCard or BudgetOverview that shows trend direction and percentage change. The component is already built.
2. **Replace icon text dropdown with visual picker** — Show a grid of 10 Lucide icon previews with labels instead of a `<select>` with name strings. Users should see the icon before selecting it.
3. **Replace CSV inputs with chip-style inputs** — For accounts, wallets, and tags in the budget form, use the same chip-input pattern recommended for transactions: add/remove chips, autocomplete from existing values.
4. **Add budget rollover / carry-over** — Allow users to configure whether unused budget carries to the next period, creating a "saved" accumulator per budget.
5. **Add budget duplication** — A "Duplicate" action (like transactions) that copies a budget with a fresh period.
6. **Fix per-budget utilization in detail dialog** — Show the individual budget's utilization in the Analytics tab, not the aggregate of all budgets. Move aggregate utilization to a separate "Overall" tab or remove it.
7. **Add budget calendar view** — Show a timeline/month grid of active budget periods so users can see overlap and plan ahead.

---

## Design Recommendations

1. **Give budget colors visible purpose** — Map `budget.color` to at least one visible element: the icon box background, a small accent dot, or a left-edge stripe on the card. Right now it's the most confusing piece of dead UI in the module.

2. **Unify the icon system** — All three representations (card, summary, form) should use the same Lucide SVGs. The form picker should show visual previews. The summary view should not use emoji.

3. **Remove the insights button at the card bottom** — The kebab dropdown already has "Show Insights". The redundant bottom button adds visual noise. Keep only one entry point.

4. **Audit the budget detail dialog for scope** — The 4-tab dialog is well-structured but the Analytics tab's utilization metric belongs at the page level, not inside a single budget. Make it about the current budget only.

5. **Surface `BudgetComparison` as a card stat** — A small "vs last month" chip (improved +2.1% / declined +5.3% / stable) in the BudgetCard would be high-value, low-space addition that uses the existing infrastructure.

6. **Reduce progress bar animation duration** — 0.9s for the initial fill is slow enough that users on a 60fps display see the bar crawl. 0.4–0.5s is sufficient for the "filling up" effect. The shimmer animation at 2s loop is a background concern.

---

## Hallmark Anti-Patterns

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Major** | Dead UI — color stored, never shown | `BudgetCard.tsx`, `Budgets.tsx` summary view, `BudgetOverview` dialog | `budget.color` set via ColorPicker is persisted to store and backend but never read by any rendering component | Map color to a visible element (icon box tint, accent bar) |
| **Major** | Icon system fracture | Summary view emoji vs card Lucide vs form text names | Three representations for the same icons — inconsistent implementation | Use Lucide SVGs everywhere; replace emoji; add visual icon picker in form |
| **Major** | Unwired component | `BudgetComparison.tsx` (104 lines) | Period-over-period comparison component exists but is never rendered in any view | Wire into BudgetCard footer or BudgetOverview detail |
| **Minor** | Same-icon tabs | `Budgets.tsx:107-119` | "Transactions" and "History" tabs both use `History` icon | Use distinct icon for History tab (`Clock`, `Archive`) |
| **Minor** | Scope confusion in detail dialog | `Budgets.tsx:67-69` | `computeBudgetUtilization(allBudgets, allTransactions)` shows aggregate metrics inside a single-budget dialog | Show only current budget's utilization |
| **Minor** | Inline component | `Budgets.tsx:53-188` | `BudgetOverview` lives inside the page component file instead of its own component file | Extract to `components/budgets/BudgetOverviewDialog.tsx` |
| **Minor** | No `prefers-reduced-motion` | `BudgetCard.tsx:49-53`, `BudgetAnalyticsPanel.tsx` | Entrance and progress animations fire regardless of user motion preference | Add reduced-motion check |
| **Minor** | `tabular-nums` absent | All budget amount displays | Proportional figures in number columns don't align | Add `font-variant-numeric: tabular-nums` |

---

## Overall Module Score

**7.0 / 10**

The Budgets module has the strongest analytical backbone in the app — the service layer is thorough, the tabbed detail dialog is well-organized, and the integration with transactions is clean. But the dead color field and icon-system fracture are visible craft issues that erode confidence. The unwired `BudgetComparison` component represents 104 lines of ready-to-ship value that just needs a home.

**Fix the dead color field and emoji-in-summary-view first (quick wins, high visibility). Then wire BudgetComparison and extract BudgetOverview (structural improvements). The icon picker redesign is the longer-term craft investment worth making.**
