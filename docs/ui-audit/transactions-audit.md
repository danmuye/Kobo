# Transactions Module UI/UX Audit

**Target:** `/transactions` — `src/pages/Transactions.tsx`
**Components:** `TransactionFormDialog` (630 lines), `ReceiptUploader` (169 lines), `ConfirmDialog`, `EmptyState`
**Supporting:** `useTransactionsPage` hook, `useTransactionModal` store, `transactionSchema` (Zod), `toTransactionPayload`
**Services:** `ITransactionService` (CRUD), `exportToCsv`/`exportToExcel`/`exportToPdf`, `ReceiptUploader` via storage service
**Date:** 2026-07-20

---

## Executive Summary

The Transactions module is functionally complete and well-integrated with the rest of the Kobo finance app. The page supports full CRUD operations, search, filter, and sort across a paginated table. The transaction form dialog is feature-rich, supporting categories, tags, budget assignment, debt payment linking, goal allocation, merchant tracking, notes, attachments, and receipt upload — all with Zod validation and react-hook-form.

However, the module suffers from **three critical gaps** that undercut its utility: **(1) No bulk actions** — users can only edit/delete one row at a time; **(2) No import/export UI** — the export service exists (`src/services/export.ts`) but has no integration point in the Transactions page; **(3) No column-header sorting** — sort is relegated to a native `<select>` dropdown instead of clickable table headers, which is both functionally limited and visually inconsistent.

The form dialog at 630 lines carries significant complexity in a single component, mixing form rendering, data transformation, cross-entity linking (goals, budgets, debts), and localStorage persistence. The `tags` field uses a comma-separated string stored in an `<input>` with "Recent"/"Suggestions" toggle pills — a UX pattern that works but feels improvised.

**Verdict: Solid feature depth, held back by missing bulk operations, absent export surface, and a form dialog due for decomposition.**

---

## UI Review

### Transaction List
- Paginated table with 8 rows per page, prev/next buttons
- Staggered framer-motion row entrance (`delay: idx * 0.02, duration: 0.15`) — subtle and effective
- Row hover state (`hover:bg-muted/30 transition`) consistent with Dashboard
- Empty states are context-aware: shows search-empty message when filters active, `EmptyState` with "Add Transaction" CTA when truly empty
- **Good:** Keyboard shortcuts (`Cmd/Ctrl+N` to add, `/` to focus search) with proper event-target guards

### Table Layout
| Column | Width | Visible | Notes |
|---|---|---|---|
| Description | Auto | Always | Icon + text + merchant + tags(≤3) + notes (truncated) |
| Category | Auto | Always | `Badge variant="secondary"` |
| Account | Auto | `≥md` | Transfer shows `from → to` |
| Date | Auto | `≥sm` | `formatDate()` |
| Amount | Right | Always | Colored by type, `+`/`−`/`↔` prefix |
| Actions | Right | Always | Duplicate / Edit / Delete icon buttons |

- **No column-header sorting** — clicking a column head does nothing. All sort control is in the dropdown.
- **No select-all checkbox** or individual row selection for bulk operations
- **No `tabular-nums`** on amount column — numbers with proportional figures don't align vertically in a column

### Filters
- 4 pill buttons: All / Income / Expense / Transfer
- `aria-pressed` for active state
- Manually styled (not using shadcn `ToggleGroup`) — `bg-background shadow-sm` for active, `text-muted-foreground` for inactive
- **No count badges** — pills don't show how many transactions of each type exist
- No date-range filter on the transactions page (only available in Reports)

### Search
- Text input with magnifying glass icon, `placeholder="Search transactions…"`
- Searches across description, category, account, notes, fromAccount, toAccount, and attachments
- Filters on every keystroke via `useMemo` — no debounce
- `useEffect` resets page to 1 when query changes — correct behavior

### Sorting
- Native `<select>` dropdown with 5 options: Newest, Oldest, Highest amount, Lowest amount, Description
- **Visually inconsistent** — the custom-styled filter pills and search input sit alongside a browser-native `<select>` that doesn't match the design language
- **Missing sort directions** — no ascending/descending toggle for any single column
- **Missing sort-by-category** or sort-by-account

### Categories
- Column renders as `Badge variant="secondary"` — consistent with Dashboard
- In the form: static `categories` array (13 entries) + recent-categories pills (max 5, from transaction history)
- Budget integration: when category selected, form shows matching budgets with remaining amounts — well-implemented
- **Hardcoded list** — category list in `TransactionFormDialog.tsx:18-21` is a static array, not configurable by the user

### Transaction Dialog
- Full-screen modal (`max-w-2xl max-h-[90vh] overflow-y-auto`)
- 3 modes: Create / Edit / Duplicate (duplicate resets date to today)
- Handles type switching dynamically (shows `fromAccount`/`toAccount` for transfer, `budgetId` for expense, `goalId` allocation for income)
- **630 lines** in a single component — large and dense
- Uses `react-hook-form` + `zodResolver` with `transactionSchema`
- recent-categories, recent-accounts, recent-wallets, recent-tags derived from full transaction history via `useMemo`
- **Last-used values** persisted to `localStorage` (type, category, account, tags) — good UX detail
- **Tags UX is improvised** — stored as comma-separated string in a text `<input>`, with clickable "Recent"/"Suggestions" toggle pills that append to the comma-separated value. This works but feels like a prototype-quality pattern compared to the rest of the form.
- **Attachments & Receipt** hidden behind a `<details>` disclosure — keeps the form clean but buries a useful feature
- **Goal allocation** only for income type — sensible

### Add/Edit Transaction Forms
- Fields: Type (select), Date (date picker), Description (text), Category (select + recents), Account/From/To (select + recents), Amount (number), Budget (select, conditional), Debt payment (checkbox + select, conditional), Merchant (text), Tags (text + pills), Notes (textarea), Attachments (text), Receipt (uploader)
- Validation via Zod `superRefine` — transfer requires different from/to accounts, non-transfer requires account
- `formatNaira` used in budget options to show remaining amounts — good context
- **Missing:** Recurring transaction support, split transactions, receipt camera capture

### Bulk Actions
- **None exist.** No select-all, no multi-select, no bulk delete, no bulk categorize, no bulk export.
- Each row has individual Duplicate/Edit/Delete buttons only

### Import/Export
- **Export service exists** (`src/services/export.ts:128` lines) — CSV with BOM, Excel via HTML table, PDF via print window
- **No export UI in Transactions page** — the service is used only by the Reports page
- **No import functionality** anywhere in the app
- This is a significant gap: users have no way to get their data out of or into the transaction list

### Icons
- All icons from `lucide-react` — consistent
- Type icons: `ArrowUpRight` (income/green), `ArrowDownRight` (expense/red), `ArrowLeftRight` (transfer/primary)
- Action icons: `Copy`, `Pencil`, `Trash2` — standard and clear
- Search uses `Search`, empty state uses `ReceiptText`
- **Good:** Icon consistency across Dashboard and Transactions

### Status Indicators
- Type indicated by icon + colored background (`bg-success/10`, `bg-destructive/10`, `bg-primary/10`)
- Amount prefixed with `+` (income), `−` (expense), `↔` (transfer)
- Tags shown as tiny outline badges (≤3), with `+N` overflow indicator
- Merchant as `@merchant` in muted text next to description
- Notes as truncated single line below description
- Transfer rows show `fromAccount → toAccount` in Account column

---

## UX Review

### User Workflows
1. **View all transactions** → paginated table, default sort newest-first
2. **Find transaction** → search text + type filter + sort dropdown
3. **Add transaction** → button or `Cmd/Ctrl+N` → dialog → form → submit
4. **Edit transaction** → pencil icon → dialog pre-filled → submit
5. **Duplicate transaction** → copy icon → dialog with date reset to today → submit
6. **Delete transaction** → trash icon → ConfirmDialog → confirm
7. **Add transaction with goal allocation** → income type → check "Allocate to goal" → select goal + amount → submit → creates 2 linked transactions

### Workflow Gaps
1. **No bulk delete** — deleting 20 transactions requires 20 individual confirm-dialog clicks
2. **No way to re-categorize** transactions in bulk
3. **No way to export** from the transactions page itself
4. **No way to import** transactions from a bank statement CSV
5. **No recurring transaction support** — each repeat transaction must be manually created
6. **No undo after delete** — optimistic delete with undo toast would be better than a confirmation dialog

### Discoverability
- Keyboard shortcuts (`Cmd/Ctrl+N`, `/`) are not advertised anywhere on the page
- "Attachments & receipt" section in the form is behind a `<details>` toggle — users may miss it
- Goal allocation only appears when type is "income" — discoverable but not obvious
- Budget assignment only appears when type is "expense" — clear contextual behavior
- The "Duplicate" action (copy icon) may not be immediately understood — could use a tooltip (though `aria-label` is set)

### Form UX Highlights
- **Last-used values** remembered via localStorage reduces repeat data entry — excellent
- **Recent categories/accounts/tags** as clickable pills — reduces typing
- **Budget context** in the category dropdown shows remaining amounts — helps decision-making
- **Transfer validation** prevents same-account transfers at the form level
- **Debt payment checkbox** links transactions to debts — good cross-entity integration

### Form UX Pain Points
- **Tags as comma-separated string** — users must understand CSV format; the pills append but don't remove; no visual tag chips in the input
- **No autocomplete/suggestion** on the description field for commonly-used descriptions
- **Attachments is a plain text input** for filenames — no file picker for attachments (only receipts have an uploader)
- **`<details><summary>` for attachments** is not keyboard-accessible by default in some browsers — the `summary` element has `cursor-pointer` and `focus-visible` but the open/close behavior is native

---

## Accessibility Review

### Passes
- `aria-label` on search input, sort select, all action buttons, pagination buttons
- `aria-pressed` on filter pills
- `aria-current="page"` via sidebar NavLink
- `aria-label` on filter group (`role="group"`)
- Keyboard shortcuts with guards against focus inside inputs
- `ConfirmDialog` uses `AlertDialog` from Radix — proper focus trapping and Escape handling
- Dialog uses Radix `Dialog` — focus management, ARIA attributes, Escape handling
- Focus-visible rings on all interactive elements
- Skip-to-main-content link from layout

### Fails / Gaps
1. **No `aria-sort` on table headers** — screen reader users cannot determine the current sort column or direction
2. **No `tabular-nums`** — `font-variant-numeric: tabular-nums` is not set on the amount column, causing proportional-figure alignment jitter
3. **Filter pills are not a `radiogroup`** — they use `role="group"` with `aria-pressed` buttons instead of `role="radiogroup"` with `role="radio"`, which is the semantically correct pattern for single-select filters
4. **Row action buttons are icon-only** — while `aria-label` is present, the icon buttons are small (32x32px) touch targets, below the 44x44px WCAG recommendation
5. **No announcement on sort/filter change** — when the user changes sort or filter, the table content may change dramatically with no `aria-live` region announcement
6. **Staggered row animations may cause issues** — the `motion.tr` with `initial={{ opacity: 0, y: 4 }}` + `transition: { delay: idx * 0.02 }` creates a visual cascade that sequential keyboard navigation may not track
7. **No `prefers-reduced-motion` support** — entrance animations and staggering don't respect the user's motion preference
8. **`<details>` for attachments** — the native `<details>` disclosure has inconsistent keyboard accessibility across browsers (some require double-activation)

---

## Mobile Review

| Element | Behavior at 375px |
|---|---|
| Search input | Full width, stacked |
| Filter pills | Full-width row, wrap |
| Sort dropdown | Full width below pills |
| Table | Horizontal scroll |
| Account column | Hidden (`hidden md:table-cell`) |
| Date column | Hidden (`hidden sm:table-cell`) |
| Action buttons | Always visible, 32x32px |
| Pagination | Stacked vertically |
| Dialog | Full-width, 90vh max height |

### Issues
1. **Action buttons at 32x32px** are below the 44x44px minimum touch target recommendation on mobile. Users may fat-finger the wrong action.
2. **No horizontal scroll indicator** — the `overflow-x-auto` on the table wrapper gives no visual cue that there's scrollable content when account/date columns are hidden (they're already hidden, so on mobile there's actually no overflow — but if more columns were added, users would need a scroll affordance)
3. **Filter pills have small tap targets** — `px-3 py-1.5` with `text-xs` produces ~30px tall buttons; adequate but tight for fingers
4. **Dialog form fields stack single-column** — correct at mobile widths, but the form is quite long and requires significant scrolling
5. **No swipe-to-delete gesture** on transaction rows — a common mobile pattern

---

## Performance Perception

### Render
- `filtered` is memoized via `useMemo` in `useTransactionsPage` — efficient
- `sortedTransactions` is memoized — recomputes only when `filtered` or `sort` changes
- Only `visibleTransactions` (max 8) renders in the DOM at a time — good
- No unnecessary re-renders in the component tree

### Concerns
- **`useFinanceStore` subscriptions** — `useTransactionsPage` subscribes to the entire `transactions` array. Any transaction mutation (even on other pages) triggers re-filter and re-sort, and row animations replay
- **Row animations on every data change** — `initial/animate` on `motion.tr` re-triggers whenever the list identity changes, causing flash restagger on every filter/sort/page change
- **No virtualization** — with `pageSize=8` this is acceptable for typical datasets, but a user with 2000+ transactions would see linear filtering cost on every keystroke

---

## Component Inventory

| Component | File | Lines | Props | Notes |
|---|---|---|---|---|
| Transactions (page) | `src/pages/Transactions.tsx` | 250 | (none — reads stores/hooks) | Search, filter, sort, paginate, delete |
| TransactionFormDialog | `src/components/transactions/TransactionFormDialog.tsx` | 630 | (reads `useTransactionModal`) | Create/Edit/Duplicate, full form, cross-entity linking |
| ReceiptUploader | `src/components/transactions/ReceiptUploader.tsx` | 169 | value, onChange, disabled, error | Drag-and-drop, file validation, preview |
| useTransactionsPage | `src/features/transactions/hooks.ts` | 38 | (none) | Filter/search logic, CRUD wrappers |
| useTransactionModal | `src/store/transaction-modal.ts` | 27 | (none — Zustand) | isOpen, mode, editingTransaction |
| transactionSchema | `src/features/forms/schemas.ts:6-39` | 34 | (none — Zod) | Validation with superRefine |
| toTransactionPayload | `src/features/forms/schemas.ts:153-185` | 33 | TransactionFormValues | Transforms form → Transaction |
| ConfirmDialog | `src/components/common/ConfirmDialog.tsx` | 53 | open, onConfirm, title, description | Wraps AlertDialog |

---

## Pain Points

1. **No bulk actions** — Users must delete/edit 20 transactions one by one. This is the most impactful missing feature.
2. **No export UI on Transactions page** — `export.ts` provides CSV/Excel/PDF but is only wired into Reports. Users on the Transactions page have no way to download their data.
3. **No import functionality** — No CSV/OFX/QFX import from bank statements. Users must manually enter every transaction.
4. **Column-header sorting absent** — The native `<select>` for sort is visually inconsistent and functionally inferior to clickable column headers with direction toggles.
5. **`TransactionFormDialog` at 630 lines** — Single component handling form rendering, validation, cross-entity linking (goals, budgets, debts), localStorage, and receipt upload. Should be split into sub-components or hooks.
6. **Tags as comma-separated string** — The tag input stores CSV text, with pills that append but don't remove. No chip-style input with remove buttons. This is the most "prototype" UX pattern in the module.
7. **No debounce on search** — Every keystroke re-filters the entire transaction array via `useMemo`. Acceptable for <500 transactions but doesn't scale.
8. **Row animations flash on every sort/filter/page change** — `motion.tr` with `initial/animate` on identity-based keys causes re-animation whenever the visible subset changes.
9. **No date-range filter** — Users must go to Reports to filter by custom date ranges, making the Transactions search less useful for time-bounded queries.
10. **No recurring transaction support** — Each repeating bill must be manually re-created.

---

## Quick Wins

1. **Add `font-variant-numeric: tabular-nums`** to the amount column (`<td>` or table container) — one CSS rule fixes number alignment
2. **Add `prefers-reduced-motion` check** — wrap `motion.tr` animations: `const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches` and skip entrance animations when true
3. **Add `aria-sort` to active sort column header** — programmatically set `aria-sort="ascending"` or `"descending"` on the relevant `<th>` based on current sort state
4. **Style the native `<select>` to match the design system** — or replace it with a custom dropdown matching the filter pill aesthetic
5. **Increase action button touch targets to 40x40px minimum** — current 32x32px `h-9 w-9` is below WCAG recommendation for mobile
6. **Add `aria-live="polite"` on the table container** — announce result count changes when filter/sort/search changes
7. **Export button in page header** — wire `exportToCsv` from `src/services/export.ts` into the Transactions page header as a secondary action ("Export CSV" or "Export" dropdown)
8. **Add count badges to filter pills** — show `(12)` next to each type label so users know the distribution without filtering

---

## Major Improvements

1. **Implement bulk selection and actions** — Add a checkbox column, a select-all header checkbox, and a floating action bar (Bulk Delete, Bulk Categorize, Bulk Export). This is the single highest-impact addition.

2. **Import CSV/OFX from bank statements** — Add an import dialog that parses a bank export file and maps columns to Kobo transaction fields. Include a preview step showing parsed results before committing.

3. **Replace column-header sort dropdown with clickable headers** — Make each `<th>` clickable with an ascending/descending indicator arrow. Keep the dropdown as a secondary option or remove it entirely. Implement multi-column sort if feasible.

4. **Decompose `TransactionFormDialog`** — Split into: `TransactionForm` (the form layout, ~200 lines), `TransactionFormHeader` (mode indicator, title), `CategorySelector` (dropdown + recent pills), `AccountSelector` (dropdown + recent + wallet pills), `TagInput` (chip-style input with autocomplete), `GoalAllocationSection`, `DebtPaymentSection`, `BudgetAssignment`. Each sub-component independently testable.

5. **Replace the CSV tag input with a proper chip input** — Use a `<div>`-based chip container with remove-on-X for each tag, plus a text input for adding new tags. The "Recent" and "Suggestions" pills should add chips, not comma-separated text.

6. **Add date-range filtering** — A "From → To" date picker above the filter pills. Persist the range in URL search params so filtered views are shareable/bookmarkable.

7. **Add debounced search** — Use a 200-300ms debounce on the search input to avoid re-filtering on every keystroke, especially as transaction count grows.

---

## Hallmark Recommendations

Using the Hallmark audit framework against the anti-pattern catalogue:

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Critical** | Tabular data without `tabular-nums` | `Transactions.tsx:203-204` | Amount column uses proportional figures; digits don't align vertically in a column of numbers | Add `font-variant-numeric: tabular-nums` to the table body or amount cells |
| **Major** | Missing bulk actions (structural gap) | `Transactions.tsx` (entire page) | No select-all, no multi-select, no bulk delete/categorize/export | Add checkbox column + floating action bar |
| **Major** | Missing export surface (feature gap) | `Transactions.tsx:84-248` | `src/services/export.ts` exists but is not wired into the Transactions page | Add "Export" dropdown to page header |
| **Major** | Native `<select>` for sort | `Transactions.tsx:124` | Visually inconsistent with rest of the design system | Replace with custom component or clickable column headers |
| **Major** | Tags as comma-separated string | `TransactionFormDialog.tsx:507` | CSV text input with append-only pills is prototype-quality UX | Replace with chip-input pattern |
| **Major** | No `prefers-reduced-motion` | `Transactions.tsx:169-173` | `motion.tr` entrance animations fire regardless of user motion preference | Check `prefers-reduced-motion` and skip animations |
| **Major** | No column-header sorting | `Transactions.tsx:136-144` | Clicking `<th>` does nothing; sort is confined to a dropdown | Make headers clickable with sort direction indicators |
| **Minor** | Filter pills not `radiogroup` | `Transactions.tsx:110` | Uses `role="group"` + `aria-pressed` buttons instead of `role="radiogroup"` + `role="radio"` | Use semantic radio group pattern |
| **Minor** | No `aria-sort` on headers | `Transactions.tsx:136-144` | Screen readers cannot determine current sort column or direction | Set `aria-sort` on the active column's `<th>` |
| **Minor** | No `aria-live` on table | `Transactions.tsx:134-224` | Content changes (filter/sort/search) are not announced | Add `aria-live="polite"` to table wrapper |
| **Minor** | Row animation re-fire | `Transactions.tsx:169-173` | `initial/animate` on `motion.tr` causes flash restagger on every filter/sort/page change | Use `layout` animation instead of `initial/animate` identity triggers or skip animation after first mount |
| **Minor** | No date-range filter | `Transactions.tsx:96-132` | Only text search + type filter + sort; no time-bounded querying | Add "From → To" date picker |

### Hallmark Scorecard

| Category | Score | Notes |
|---|---|---|
| Philosophy | 3/5 | Full-featured but missing bulk operations and export |
| Hierarchy | 4/5 | Clear table layout, good visual weight distribution |
| Execution | 4/5 | Well-typed, validated, integrated across entities |
| Specificity | 3/5 | Tags UX is prototype-quality; native select is inconsistent |
| Restraint | 3/5 | Form dialog at 630 lines does too much in one file |
| Variety | 3/5 | Same card/table pattern as Dashboard — consistent but undifferentiated |

---

## Overall Module Score

**6.5 / 10**

The Transactions module delivers robust core functionality (CRUD, search, filter, sort, pagination, cross-entity linking to budgets/goals/debts) with solid validation and keyboard support. However, three structural gaps — no bulk actions, no export from the page, no column-header sorting — keep it from feeling like a production-grade data management tool. The tag-input UX and 630-line monolithic form dialog are the most visible craft deficits.

**Fix critical `tabular-nums` first (one CSS rule). Then tackle bulk selection and export wiring (major, high user impact). Decompose the form dialog after — the component is sound but due for structural editing.**
