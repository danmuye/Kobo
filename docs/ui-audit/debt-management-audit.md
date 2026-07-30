# Debt Management Module UI/UX Audit

**Target:** `/debts` — `src/pages/Debts.tsx`
**Components:** `DebtCard` (251 lines), `DebtPaymentDialog` (184 lines), `DebtAnalyticsDialog` (248 lines), `DebtPaymentsDrawer` (170 lines)
**Services:** `debt-matching.ts` (169 lines), `debt-insights.ts`, `debt-history.ts`
**Date:** 2026-07-20

---

## Executive Summary

The Debt Management module is a solid, full-featured page for tracking repayment progress. It provides an auto-matching engine that links transactions to debts, a detailed card view with 12 metrics per debt, a status system (on-track / behind / critical / overdue / paid-off), analytics charts, and a historical summary for paid-off debts. The main CRUD form uses `react-hook-form` with `zod` validation — consistent with the app's best patterns.

Three issues hold it back from a higher score: **(1) `debt.color` and `debt.icon` are stored but never rendered** — the DebtCard always shows a generic `CreditCard` icon regardless of the stored value; **(2) `DebtPaymentDialog` uses raw `useState` instead of `react-hook-form`**, repeating the same inconsistency seen in the goals contribution dialog; **(3) the `getDebtStatus` threshold logic maps both ≥90% ("Almost there") and ≥50% ("Halfway") to the same `value: "behind"` status badge**, so two meaningfully different progress stages receive the same visual treatment.

**Verdict:** Capable and functional, with a strong matching engine and good analytical depth, but held back by a dead color/icon field, an inconsistent dialog pattern, and a status-threshold overlap.

---

## UI Review

### Page Layout
- Summary stats grid (3 cards): Total Debt, Paid Off, Monthly Minimum — each with `shadow-elegant` and `font-display text-2xl`
- Tabs for Active / Paid Off debts with `TabsList` + `TabsContent`
- Empty states for: no debts at all, all debts paid off, no paid-off debts yet
- Delete confirmation via `AlertDialog` — consistent with the app

### Debt Cards (DebtCard.tsx)
- Animated entrance (`motion.div` with `initial: opacity 0, y: 12`)
- Hover lift effect (`whileHover: y: -4`) — consistent with StatCard and BudgetCard
- Status badge with `debtStatusToneBg` — 5 status tiers (paid-off, on-track, behind, critical, overdue)
- Progress bar with Framer Motion animated fill (0.9s easeOut) and shimmer overlay
- Metrics grid: Original / Remaining (2-col), Paid / Monthly / Min/mo (3-col), plus 4 info rows (Payments, Days until due, Interest rate, Health score, Est. Payoff)
- "Make Payment" button — full width, primary CTA
- Kebab dropdown with 5 items: Make Payment, Edit Debt, View Payments, View Analytics, Delete Debt
- Paid-off cards: success-tinted border, `Sparkles` icon with `animate-pulse`, `AnimatePresence` mount/unmount
- Overdue cards: destructive-tinted border, `h-1 bg-destructive` top bar
- **`debt.icon` and `debt.color` are never rendered** — the icon box always shows a generic `CreditCard` Lucide SVG, and the color picker value persists but no component uses it. Same dead-UI anti-pattern as Budgets (line 112 hardcodes `CreditCard` icon).

### Debt Form (main Debts.tsx dialog)
- Uses `react-hook-form` + `zodResolver` with `debtSchema` — correct pattern
- Fields: Name, Lender, Original Amount, Type, Repayment Type, Min Payment, Interest Rate, Due Date, Start Date, Categories, Accounts, Wallets, Tags, Color (ColorPicker), Icon (text dropdown), Include Transfers toggle, Notes
- ColorPicker: 10 swatches with `role="radiogroup"`, `aria-checked`, `aria-label` — accessible
- Icon selector: text dropdown of name strings (`"credit-card"`, `"landmark"`, etc.) — no visual preview
- Tags, categories, accounts, wallets: CSV text inputs — consistent with the rest of the app but error-prone
- `includeTransfers`: checkbox — determines whether transfer-type transactions count as debt payments

### Debt Payment Dialog (DebtPaymentDialog.tsx)
- **Raw `useState` pattern** — 6 state variables (amount, selectedAccount, wallet, date, notes, tags) managed manually instead of using `react-hook-form`
- Fields: Amount, From Account (with balance display), Wallet, Date, Notes, Tags
- Balance validation: inline error when amount exceeds available balance; submit button disabled
- No field-level validation errors — just disabled submit + conditional balance error string
- Tags as CSV text input — same pattern
- **Inconsistent with the app's established `react-hook-form` pattern** (used in main Debt CRUD, Budget CRUD, etc.)

### Debt Analytics Dialog (DebtAnalyticsDialog.tsx)
- Recharts charts: Bar (monthly payments), Area (outstanding balance), Pie (payment distribution), Bar (debt distribution across all debts)
- `InsightsCards` component: 10 metric boxes (Health Score, Payoff Velocity, Monthly Avg, Est. Interest, Largest Payment, Avg Payment, Payments/mo, Payoff Date, Remaining, Paid vs Target)
- Payoff Forecast section: 4 metrics (Months Remaining, Est. Payoff Date, Monthly Required, On Track)
- Debt Utilization section: Total Original, Total Paid, Total Remaining, Progress %
- Largest Payments list
- Chart colors: hardcoded HSL values (`hsl(217 91% 60%)`, `hsl(142 71% 45%)`, `hsl(0 72% 55%)`) — token drift risk, same as Dashboard's COLORS array
- `COLORS` array: 5 hardcoded values for pie chart — chromatic spread concern
- No `aria-label` on chart SVGs

### Debt Payments Drawer (DebtPaymentsDrawer.tsx)
- Sheet component with summary metrics (Original, Paid, Remaining, Progress, Min Payment, Payments)
- Status badge
- Repayment transaction table: Description, Category, Account, Merchant, Date, Amount
- Sorted by date descending
- Empty state for no payments
- **No `tabular-nums`** on amount column
- **No column sorting** — table is display-only
- Tags truncated to 2 badges per row — acceptable but arbitrary
- Responsive column hiding (`hidden sm:table-cell`, `hidden md:table-cell`, etc.)

---

## UX Review

### User Workflows
1. **Page → View debts** — Active tab by default, summary stats at top
2. **Page → Add Debt** — primary CTA in PageHeader, empty-state CTA
3. **Page → Edit/Delete Debt** — kebab dropdown on each card
4. **Page → Make Payment** — card button or kebab → opens payment dialog
5. **Page → View Payments** — kebab → opens drawer with transaction history
6. **Page → View Analytics** — kebab → opens analytics dialog with charts
7. **Page → Paid Off tab** — archived debts with history
8. **Auto-archive** — `useEffect` on `Debts.tsx:100-110` checks for paid-off debts and archives metrics automatically

### Discoverability
- Primary actions are clear: Add Debt (PageHeader), Make Payment (card button)
- Kebab menu is in the expected location (top-right of each card)
- Analytics and payment history are secondary actions behind the kebab — appropriate hierarchy
- Empty states guide users to add their first debt

### Information Density
- DebtCard: 12 data points in a compact card — high density but well-organized in nested grids
- InsightsCards: 10 metric boxes — borderline overwhelming in one row of a dialog
- The payment drawer has 6 summary metrics before the transaction table — good context-setting

### Empty States
- No debts: centered illustration, title, description, Add Debt CTA — well done
- All debts paid off: `Sparkles` icon, "All debts paid off!" — celebratory
- No paid-off debts yet: `Archive` icon, description
- No matching payments: `ReceiptText` icon, explanation of matching logic — informative

### Loading States
- No skeleton or loading state for the Debts page itself — page renders immediately from store
- Dialog content renders synchronously — no loading spinners for analytics computation
- Analytics data is computed via `useMemo`, which is synchronous — fine for moderate datasets but could cause frame drops with large transaction sets

---

## Accessibility Review

### Passes
- `role="article"` on DebtCard with `aria-label` including debt name and status
- `role="progressbar"` with `aria-valuenow/min/max` on progress bar
- `role="radiogroup"`, `aria-checked`, `aria-label` on ColorPicker
- `aria-hidden` on decorative elements (progress bar shimmer, icon box icon)
- Semantic heading hierarchy within dialogs (`DialogTitle` → `h2`)

### Fails / Gaps
1. **Chart SVGs have no accessible labels** — Recharts charts in `DebtAnalyticsDialog` render unstyled SVG elements with no `role="img"` or `aria-label`
2. **No `tabular-nums` on amount values** — amount columns in the payments drawer table use proportional figures
3. **Color-only status indicators** — the status badge (text label + background color) is the only status indicator; the card's top accent bar is color-only for overdue/paid-off
4. **No `prefers-reduced-motion`** — Framer Motion entrance animations and progress bar fill animations fire regardless of user preference
5. **Small metric labels** — `text-[10px]` for metric labels in `InsightsCards` and payments drawer summary may fail WCAG SC 1.4.4

---

## Mobile Review

### Breakpoints
| Width | Behavior |
|---|---|
| 320px | Cards stack 1-col. Summary cards stack 1-col. Dialog full-width. Payments drawer table scrolls horizontally. |
| 375px | Same layout — adequate. |
| 768px | 2-col debt cards. Table shows Category and Date columns. Sidebar off-screen. |

### Issues
1. **Debt card horizontal overflow** — 3-col metric grid (`grid-cols-3`) at 320px forces very narrow cells; "Min/mo" label wraps awkwardly
2. **No mobile-specific optimization** — same density and layout as desktop
3. **Payments drawer table overflow** — 6 columns with responsive `hidden` classes; at narrow widths only Description and Amount are visible, removing Category context

---

## Performance Perception

### Load
- Debts page is not explicitly lazy-loaded (no `React.lazy()` observed for this route)
- Service functions (`calculateDebtMetrics`, `getDebtAnalytics`) are computed synchronously via `useMemo` on every store change
- `useEffect` auto-archive runs on every render where `debtsWithMetrics` changes

### Render
- `DebtCard` is `memo()`-wrapped — prevents unnecessary re-renders
- Analytics data is memoized with proper dependencies
- Payment drawer sorting is memoized

### Concerns
- **Recharts in a dialog** — `DebtAnalyticsDialog` mounts BarChart, AreaChart, PieChart, and BarChart simultaneously (4 SVG trees), which can be heavy
- **Auto-archive `useEffect`** runs on every `debtsWithMetrics` change, which recalculates on any transaction change — could cause unnecessary archival checks
- **No virtualization** in the payments drawer table — acceptable for typical debt counts (<100 transactions per debt)

---

## Component Inventory

| Component | File | Lines | Props | Notes |
|---|---|---|---|---|
| DebtCard | `src/components/debts/DebtCard.tsx` | 251 | debt, onEdit/onDelete/onMakePayment/onViewTransactions/onViewAnalytics | Memoized, animated, 12 metrics, kebab menu |
| DebtPaymentDialog | `src/components/debts/DebtPaymentDialog.tsx` | 184 | debt, open, onOpenChange | Raw useState, balance validation |
| DebtAnalyticsDialog | `src/components/debts/DebtAnalyticsDialog.tsx` | 248 | debt, debts, transactions, open, onOpenChange | 4 Recharts charts, 10 insight cards, forecast |
| DebtPaymentsDrawer | `src/components/debts/DebtPaymentsDrawer.tsx` | 170 | debt, transactions, open, onOpenChange | Sheet drawer, 6 metrics, transaction table |

---

## Pain Points

1. **Dead color/icon fields** — `debt.color` and `debt.icon` are persisted but never rendered. DebtCard always shows a generic `CreditCard` icon in a destructive-tinted box, ignoring the user's color and icon selection.
2. **Raw `useState` in payment dialog** — `DebtPaymentDialog` manages 6 fields with individual `useState` calls instead of `react-hook-form`, inconsistent with the main debt form and the app's established pattern.
3. **Status threshold overlap** — Both ≥90% ("Almost there") and ≥50% ("Halfway") map to `value: "behind"` in `getDebtStatus`, giving them the same badge color despite different progress stages. The ≥10% range maps to "on-track" while <10% maps to "critical" ("Getting started") — aggressive labeling for early-stage debts.
4. **Hardcoded chart colors** — `DebtAnalyticsDialog` uses raw HSL strings for chart fills that duplicate but aren't derived from CSS custom properties — token drift risk.
5. **No `tabular-nums` on amounts** — Amount values in the payments drawer table and metric cards use proportional figures.
6. **Chart SVGs lack aria-labels** — All Recharts in analytics dialog are inaccessible to screen readers.
7. **No `prefers-reduced-motion`** — Card entrance animations and progress bar fill animations ignore user preference.

---

## Quick Wins

1. **Render `debt.icon` and `debt.color` in DebtCard** — Use the stored icon name with a Lucide icon map (similar to BudgetCard's `iconMap`) and apply `debt.color` to the icon box background. This is purely a rendering change — the data already exists.
2. **Add `tabular-nums` to the payments drawer table** — One CSS class on the amount column (`<td className="tabular-nums">`).
3. **Add `prefers-reduced-motion` check** — Conditionally skip Framer Motion entrance animations.
4. **Provide chart `aria-label` descriptions** — Wrap each chart container with `role="img"` and `aria-label`.
5. **Add loading/empty states for analytics** — Show a message when no payment data exists instead of rendering empty chart axes.

---

## Major Improvements

1. **Refactor `DebtPaymentDialog` to `react-hook-form`** — Replace the 6 raw `useState` variables with `useForm`, add a `zod` schema for validation (amount > 0, required account, etc.), and use `RHFInput`/`RHFSelect` fields. This brings the payment dialog in line with the main debt form and the rest of the app.
2. **Fix status threshold overlap in `getDebtStatus`** — Assign distinct `value` entries for ≥90% (e.g., "almost-there" with a success-tinted badge) vs ≥50% (keep "behind"). Consider renaming "critical" for <10% to something less alarming for users who just started ("just-started").
3. **Consolidate chart colors with theme tokens** — Replace hardcoded HSL strings in `DebtAnalyticsDialog` with references to CSS custom properties via a utility, or at minimum centralize them in a single constants object.
4. **Add bulk actions** — No checkbox selection or bulk delete/archive for debts.
5. **Add export surface** — No CSV export for debt data or payment history from the page itself.

---

## Hallmark Recommendations

Using the Hallmark audit framework against the anti-pattern catalogue:

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Major** | Dead UI (stored but unused) | `DebtCard.tsx:106-113` | `debt.icon` and `debt.color` are set via ColorPicker and persisted, but DebtCard hardcodes `CreditCard` icon and a fixed `bg-destructive/10` background | Use a Lucide icon map + dynamic color on the icon box |
| **Major** | Dialog pattern inconsistency | `DebtPaymentDialog.tsx:25-31` | 6 raw `useState` variables instead of `react-hook-form` — same issue as `GoalContributionDialog` | Refactor to `useForm` + `zodSchema` + `RHFInput`/`RHFSelect` |
| **Major** | Token drift | `DebtAnalyticsDialog.tsx:111,123,168-169` | Chart fills use raw HSL strings not derived from CSS custom properties | Consolidate into theme-derived constants |
| **Minor** | Status threshold overlap | `debt-matching.ts:45-48` | ≥90% and ≥50% both map to `value: "behind"` | Assign distinct status values |
| **Minor** | No `tabular-nums` | `DebtPaymentsDrawer.tsx:155-160` | Amount column uses proportional figures | Add `tabular-nums` class |
| **Minor** | No `prefers-reduced-motion` | `DebtCard.tsx:78-81` | Entrance animations ignore user preference | Add motion query check |
| **Minor** | Chart accessibility | `DebtAnalyticsDialog.tsx:104-173` | Recharts SVGs have no aria-labels | Add `role="img"` + `aria-label` |

### Hallmark Scorecard

| Category | Score | Notes |
|---|---|---|
| Philosophy | 4/5 | Clear purpose and well-scoped feature set |
| Hierarchy | 3/5 | Cards are consistent but don't differentiate active vs troubled vs paid-off beyond status badge |
| Execution | 4/5 | Well-coded service layer, memoized components, accessible form controls |
| Specificity | 3/5 | Generic card icon and dead color field reduce the sense of user customization |
| Restraint | 4/5 | Good balance of features without over-engineering (except the auto-archive effect) |
| Variety | 3/5 | All cards look identical regardless of debt type or status (beyond the badge) |

---

## Overall Score

**6.8 / 10**

A well-structured debt management page with a strong analytical backbone. The matching engine and service layer are the module's strongest assets — `calculateDebtMetrics`, `getDebtStatus`, and `getMatchingDebtTransactions` provide a clean foundation. The UX is functional and predictable, with good empty states and proper confirmation dialogs.

The main issues are craft-level: a stored-but-unrendered color/icon field (same dead-UI pattern as Budgets), a `useState`-based payment dialog that breaks the app's `react-hook-form` convention, and a status threshold that conflates "almost there" with "halfway." None are difficult to fix, but they compound the sense that the module was built to the "good enough" line rather than polished.

**Render the stored icon and color first (quick win + major UX improvement), then refactor the payment dialog to react-hook-form (consistency), then fix the status threshold (clarity).** These three changes would bring the score to ~7.8.
