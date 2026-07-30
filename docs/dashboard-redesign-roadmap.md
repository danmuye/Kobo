# Kobo Dashboard Redesign — Implementation Roadmap

**Source Documents:**
- `docs/dashboard-current-analysis.md` — existing dashboard state
- `docs/dashboard-design-language.md` — target design language
- `docs/dashboard-blueprint-v1.md` — target layout and component spec

**Constraint:** Zero changes to Firebase, Zustand, offline support, business logic, or any `store/`, `services/`, or `types/` files.

---

## Phase 1 — New UI Primitives

No functional changes. No changes to `Dashboard.tsx`. Build standalone reusable components that can be tested in isolation.

### Phase 1a — WidgetHeader + DashboardSection

**Purpose:** Create consistent section wrappers used throughout the new dashboard.

**Files affected:**
- `src/components/dashboard/WidgetHeader.tsx` (new)
- `src/components/dashboard/DashboardSection.tsx` (new)

**WidgetHeader props:**
- `title: string`
- `action?: { label: string; to: string }` — optional "View All" link
- `className?: string`

**DashboardSection props:**
- `id?: string`
- `children: ReactNode`
- `className?: string`

**Business logic affected:** None

**Risk:** Minimal — pure presentational components.

**Testing checklist:**
- [ ] WidgetHeader renders title text
- [ ] WidgetHeader renders action link when provided
- [ ] WidgetHeader does not render action slot when omitted
- [ ] DashboardSection renders children
- [ ] DashboardSection accepts className override

---

### Phase 1b — KPIStatCard

**Purpose:** Compact stat card for Income, Expenses, Savings, Budget Health. Replaces large StatCard in the secondary row.

**Files affected:**
- `src/components/dashboard/KPIStatCard.tsx` (new)

**Props:**
- `label: string`
- `value: number`
- `icon: LucideIcon`
- `trend?: { direction: "up" | "down"; value: number }`
- `color?: "emerald" | "blue" | "amber" | "purple" | "rose"`
- `compact?: boolean`

**Visual spec (from design language):**
- Smaller than current StatCard (~60% width)
- `rounded-xl` (16px), soft shadow, thin border
- Icon on left or top-left
- Value prominent but smaller than Hero
- Optional trend indicator
- Single accent color per card (no per-card gradient)

**Business logic affected:** None — receives pre-formatted values.

**Risk:** Minimal — new standalone component.

**Testing checklist:**
- [ ] Renders label, value, icon correctly
- [ ] Trend arrow renders up/down with correct color
- [ ] Compact mode reduces padding and font size
- [ ] Color prop applies correct accent (emerald/blue/amber/purple/rose)
- [ ] Number uses tabular-nums
- [ ] Icon renders at correct size (h-5 w-5)

---

### Phase 1c — CompactBudgetCard

**Purpose:** Slim horizontal budget card for Dashboard Budget Overview section. Replaces full BudgetCard on dashboard only.

**Files affected:**
- `src/components/dashboard/CompactBudgetCard.tsx` (new)

**Props:**
- `name: string`
- `spent: number`
- `budget: number`
- `status: "healthy" | "warning" | "exceeded"`
- `onClick?: () => void`

**What it shows:**
- Budget name (left)
- Thin progress bar
- Spent / Budget amount
- Status text ("On track", "Near limit", "Exceeded")
- Mini trend indicator

**Business logic affected:** None — receives pre-calculated values. Uses existing `formatNaira`.

**Risk:** Minimal — new component.

**Testing checklist:**
- [ ] Renders budget name truncated if long
- [ ] Progress bar fills proportionally
- [ ] Status color changes for healthy/warning/exceeded
- [ ] onClick fires when card is clicked
- [ ] Shows remaining or overspent amount
- [ ] Works with zero values

---

### Phase 1d — CompactGoalCard

**Purpose:** Compact goal card with progress ring for Dashboard Savings Goals section. Replaces full GoalCard on dashboard only.

**Files affected:**
- `src/components/dashboard/CompactGoalCard.tsx` (new)
- `src/components/dashboard/ProgressRing.tsx` (new)

**ProgressRing props:**
- `percentage: number`
- `size?: number` (default 48)
- `strokeWidth?: number` (default 4)
- `color?: string`

**CompactGoalCard props:**
- `name: string`
- `saved: number`
- `target: number`
- `targetDate: string`
- `percentage: number`
- `onClick?: () => void`

**Business logic affected:** None — receives pre-calculated values.

**Risk:** Minimal — new component.

**Testing checklist:**
- [ ] ProgressRing renders circle with correct fill percentage
- [ ] ProgressRing animates on mount
- [ ] CompactGoalCard shows goal name, saved amount, target, date
- [ ] Target date formats correctly
- [ ] onClick fires on card click
- [ ] Works with completed goals (100%+)

---

### Phase 1e — QuickActionCard

**Purpose:** Large icon button for quick actions inside the Hero card.

**Files affected:**
- `src/components/dashboard/QuickActionCard.tsx` (new)

**Props:**
- `icon: LucideIcon`
- `label: string`
- `onClick: () => void`
- `variant?: "primary" | "secondary"`

**Visual spec:**
- Large touch target (min 48px)
- Icon + label
- Subtle background fill on hover
- Used for: +Transaction, Transfer, Budget, Goal

**Business logic affected:** None — onClick is passed in.

**Risk:** Minimal.

**Testing checklist:**
- [ ] Renders icon and label
- [ ] onClick fires on click
- [ ] Hover state changes background
- [ ] Variant changes icon box color

---

### Phase 1f — FinancialInsightCard

**Purpose:** Small insight/recommendation card for the Insights section.

**Files affected:**
- `src/components/dashboard/FinancialInsightCard.tsx` (new)

**Props:**
- `icon: LucideIcon`
- `message: string`
- `type: "positive" | "negative" | "info"`
- `action?: { label: string; onClick: () => void }`

**Business logic affected:** None — static content card.

**Risk:** Minimal.

**Testing checklist:**
- [ ] Renders icon, message, type styling
- [ ] Positive type shows green accent
- [ ] Negative type shows red accent
- [ ] Info type shows blue accent
- [ ] Action button renders when provided

---

### Phase 1g — SnapshotMetric

**Purpose:** Miniature statistic row for Financial Snapshot section (Net Worth, Savings Rate, etc.).

**Files affected:**
- `src/components/dashboard/SnapshotMetric.tsx` (new)

**Props:**
- `label: string`
- `value: string`
- `trend?: { direction: "up" | "down" | "stable"; value: string }`
- `icon?: LucideIcon`

**Business logic affected:** None.

**Risk:** Minimal.

**Testing checklist:**
- [ ] Renders label and value
- [ ] Trend indicator renders when provided
- [ ] Stable trend shows no arrow
- [ ] Icon renders when provided

---

### Phase 1h — CompactTransactionItem

**Purpose:** Slim transaction row for compact list on dashboard.

**Files affected:**
- `src/components/dashboard/CompactTransactionItem.tsx` (new)

**Props:**
- `description: string`
- `category: string`
- `amount: number`
- `type: "income" | "expense"`
- `timestamp: string`
- `onClick?: () => void`

**Business logic affected:** None.

**Risk:** Minimal.

**Testing checklist:**
- [ ] Renders description, category, amount, time
- [ ] Income shows green amount with + prefix
- [ ] Expense shows default amount with − prefix
- [ ] Category shows as subtle badge or text
- [ ] onClick fires on row click

---

## Phase 2 — Hero Financial Overview

**Purpose:** Build the large Hero card that becomes the primary visual focus of the dashboard.

**Files affected:**
- `src/components/dashboard/FinancialHeroCard.tsx` (new)
- `src/components/dashboard/QuickActionCard.tsx` (from Phase 1e)

**FinancialHeroCard props:**
- `totalBalance: number`
- `monthlyChange: number`
- `availableBalance: number`
- `income: number`
- `expenses: number`
- `savings: number`
- `sparklineData: number[]`
- `onAddTransaction: () => void`
- `onTransfer: () => void`
- `onCreateBudget: () => void`
- `onCreateGoal: () => void`

**Visual spec (from blueprint):**
- Occupies ~65% of first row
- Total balance as largest number on page (40-48px)
- Monthly change with arrow + percentage + previous month comparison
- Available balance as secondary metric
- Horizontal row: Income / Expenses / Savings
- Mini sparkline (last 30 days)
- Quick action buttons at bottom

**Business logic affected:** None — receives pre-computed values. Uses existing `formatNaira`.

**Risk:** Low-medium. New component, no existing code modified.

**Testing checklist:**
- [ ] TotalBalance renders as largest text on page
- [ ] MonthlyChange renders with correct arrow direction and color
- [ ] AvailableBalance renders as secondary text
- [ ] Income/Expenses/Savings row renders three values
- [ ] Sparkline renders as mini area chart
- [ ] Quick action buttons render and fire callbacks
- [ ] No layout shift when data loads
- [ ] Responsive: stacks vertically on mobile

---

## Phase 3 — Simplify Dashboard (Cleanup)

**Purpose:** Remove large widgets from Dashboard that belong on dedicated pages. No layout changes yet — just deletion.

**Files affected:**
- `src/pages/Dashboard.tsx`

**Remove from Dashboard.tsx:**
1. Budget Health inline mini-cards section (Chart Row 2, column 2)
2. Full BudgetCard grid from "Current Budgets" collapsible section
3. Full GoalCard grid from "Savings Goals" collapsible section
4. Monthly Contributions chart from "Savings Goals" section
5. Transaction search input, filter dropdown, sort dropdown, pagination controls
6. "Manage Budgets" button
7. "View Reports" button from PageHeader
8. "Create Goal" empty state action

**What remains (after removal):**
- PageHeader (greeting only)
- Empty state (if no transactions)
- 5 StatCards row
- Chart Row 1 (Income vs Expenses + Cash Flow)
- Chart Row 2 (Spending by Category only — the Budget Health card is removed)
- "Savings Goals" collapsible section (empty — will be filled in Phase 5)
- "Current Budgets" collapsible section (empty — will be filled in Phase 5)
- "Recent Transactions" collapsible section (simplified — no search/filter/sort/pagination)

**Business logic affected:** None — no store or service code is touched. The data is still computed by `useDashboardMetrics()` and `useBudgetsPage()`; components simply stop rendering the removed sections.

**Risk:** Medium — Dashboard.tsx is modified. Risk is mitigated because:
- Removed sections are self-contained JSX blocks
- No shared state or effects are removed
- The page still renders without errors

**Testing checklist:**
- [ ] Dashboard loads without errors
- [ ] PageHeader renders greeting without action buttons
- [ ] Stat cards render correctly (all 5 still present)
- [ ] Chart Row 1 renders both charts
- [ ] Chart Row 2 renders Spending by Category only
- [ ] Budget Health card is removed (no empty container)
- [ ] "Savings Goals" collapsible section is present but empty
- [ ] "Current Budgets" collapsible section is present but empty
- [ ] "Recent Transactions" section shows transactions without search/filter/sort/pagination
- [ ] Empty state still renders when no transactions exist
- [ ] No console errors

---

## Phase 4 — Dashboard Layout Restructure

**Purpose:** Replace the old grid layout with the new widget-based layout. This is the core restructuring phase.

**Files affected:**
- `src/pages/Dashboard.tsx`

**New layout structure:**

```
┌──────────────────────────────────────────────────────┐
│  Dashboard Header (greeting, no actions)               │
├──────────────────────────────────────────────────────┤
│  Hero Financial Overview        │  Quick KPIs        │
│  (FinancialHeroCard)            │  Income            │
│                                 │  Expenses          │
│                                 │  Savings           │
│                                 │  Budget Health     │
│                                 │                    │
│  ~65%                           │  ~35%              │
├──────────────────────┬───────────────────────────────┤
│  Cash Flow Chart     │  Financial Snapshot           │
│  (large area chart)  │  Net Worth                    │
│                      │  Savings Rate                 │
│  ~66%                │  Budget Utilization            │
│                      │  ~33%                          │
├──────────────────────┴───────────────────────────────┤
│  Recent Transactions  │  Savings Goals               │
│  (Compact list, 5)    │  (Compact cards, 3 max)      │
│  ~50%                 │  ~50%                        │
├──────────────────────┬───────────────────────────────┤
│  Budget Overview     │  Financial Insights           │
│  (Compact cards, 4)  │  (Insight cards, 3-4)        │
│  ~50%                │  ~50%                        │
└──────────────────────┴───────────────────────────────┘
```

**Grid system changes:**
- Replace `space-y-8` single-column with a 12-column grid
- Each section becomes a widget that spans a specific number of columns
- Maximum content width: `max-w-[1440px] mx-auto`
- Section spacing: 40px (up from 32px)
- Card padding: 24px (up from 20px)

**What is wired in:**
- `FinancialHeroCard` (Phase 2) in first row, ~7-8 columns
- `KPIStatCard` x4 (Phase 1b) in first row, ~4-5 columns
- Cash Flow chart promoted to largest chart (~8 columns)
- Financial Snapshot (~4 columns) with `SnapshotMetric` rows
- `CompactTransactionItem` list (~6 columns) with `WidgetHeader`
- `CompactGoalCard` grid (~6 columns) with `WidgetHeader`
- `CompactBudgetCard` grid (~6 columns) with `WidgetHeader`
- `FinancialInsightCard` list (~6 columns) with `WidgetHeader`

**Business logic affected:**
- `useDashboardMetrics()` continues to return all existing data
- `useBudgetsPage()` continues to return all budget data
- `useFinanceStore` selectors unchanged
- The hook return values are the same; only the rendering changes

**Risk:** High — this is the largest single change to Dashboard.tsx. Mitigations:
- Keep all old code commented or in a backup branch until verified
- Test each section independently as it's added
- Verify no duplicate API calls or selector subscriptions

**Testing checklist:**
- [ ] Dashboard loads without errors
- [ ] 12-column grid renders correctly at desktop widths
- [ ] Content does not exceed 1440px max-width
- [ ] Hero card occupies ~65% of first row
- [ ] 4 KPI cards occupy remaining ~35%
- [ ] Cash Flow chart is largest chart on page (~2/3 width)
- [ ] Financial Snapshot renders beside Cash Flow
- [ ] Recent Transactions list renders 5 items max
- [ ] Savings Goals section renders max 3 compact cards
- [ ] Budget Overview section renders max 4 compact cards
- [ ] Financial Insights section renders insight cards
- [ ] `max-w-[1440px]` prevents content from stretching on ultra-wide
- [ ] All sections have consistent `DashboardSection` wrapper
- [ ] Section spacing is 40px between rows
- [ ] Chart tooltips still work correctly

---

## Phase 5 — Remove StatCard Row + Wire Hero Data

**Purpose:** Replace the 5 StatCards with data flowing into the Hero card and 4 KPI cards. This removes the last of the old layout.

**Files affected:**
- `src/pages/Dashboard.tsx`

**Changes:**
1. Remove the 5 `<StatCard>` components from the grid
2. Pass data from `useDashboardMetrics()` into `<FinancialHeroCard>`
3. Pass data from `useDashboardMetrics()` into 4 `<KPIStatCard>` instances

**Which KPI cards:**
1. **Income** — `stats.income`, 8.6% trend, TrendingUp icon, emerald color
2. **Expenses** — `stats.expenses`, -3.1% trend, TrendingDown icon, rose color
3. **Savings** — `stats.savings`, 12.4% trend, PiggyBank icon, purple color
4. **Budget Health** — aggregated from `budgetsWithProgress`, PieChart icon, amber color

**Budget Health KPI logic (new):**
- Count how many budgets are healthy (< 75%), near limit (75-99%), exceeded (≥ 100%)
- Display as: "3 healthy · 1 near limit · 0 exceeded"
- Uses existing `budgetsWithProgress` data

**Business logic affected:**
- `useDashboardMetrics()` data is still computed the same way
- Budget aggregation for Budget Health KPI needs a small utility function (can live in `features/dashboard/utils.ts` or inline)
- No store changes needed

**Risk:** Medium. The Hero card becomes the new primary visual. StatCard removal is straightforward since they are self-contained.

**Testing checklist:**
- [ ] No StatCard components remain in Dashboard.tsx
- [ ] `StatCard.tsx` file still exists (used elsewhere or kept for reuse)
- [ ] FinancialHeroCard receives correct data from useDashboardMetrics()
- [ ] Total balance value matches old StatCard value
- [ ] Monthly change percentage matches expected value
- [ ] Available balance displays correctly
- [ ] Income KPI shows correct month-to-date value
- [ ] Expenses KPI shows correct month-to-date value
- [ ] Savings KPI shows correct month-to-date value
- [ ] Budget Health KPI shows aggregated counts
- [ ] All four KPI trend indicators match old delta badge values
- [ ] Income vs Expenses chart still renders with correct data
- [ ] Spending by Category chart still renders with correct data
- [ ] Empty state renders correctly when no transactions exist
- [ ] No console errors or React warnings

---

## Phase 6 — Remove Collapsible Sections + Final Layout Polish

**Purpose:** Remove the old collapsible sections pattern and finalize the widget grid.

**Files affected:**
- `src/pages/Dashboard.tsx`

**Changes:**
1. Remove "Savings Goals" `CollapsibleSection` (replaced by new Savings Goals widget in Phase 4 grid)
2. Remove "Current Budgets" `CollapsibleSection` (replaced by Budget Overview widget in Phase 4)
3. Remove "Recent Transactions" `CollapsibleSection` (replaced by compact transactions widget in Phase 4)
4. Remove `CollapsibleSection` import
5. Clean up any remaining dead code, unused imports, unused state variables

**What is cleaned up:**
- `query`, `setQuery` state → removed (search moved out)
- `filter`, `setFilter` state → removed
- `sort`, `setSort` state → removed
- `page`, `setPage` state → removed
- `pageSize` constant → removed
- `filteredTransactions` memo → removed
- `pagedTransactions` memo → removed
- `useEffect` that resets page on filter change → removed
- `useBudgetsPage` → may still be needed for Budget Health KPI aggregation
- `goalsWithMetrics` memo → may still be needed if compact goals use metrics
- `hasTransactions`, `hasBudgets`, `hasGoals` → may be simplified

**Business logic affected:**
- `useDashboardMetrics()` still used for hero + KPIs + charts
- `useBudgetsPage()` still used if Budget Health KPI needs budget data
- If Budget Health KPI only needs budget count/status, it could use a simpler selector from `useFinanceStore` directly to avoid the full `useBudgetsPage()` overhead

**Risk:** Low-medium. These are JSX removals and import cleanup. The data still flows through hooks.

**Testing checklist:**
- [ ] No `CollapsibleSection` usage remains in Dashboard.tsx
- [ ] No search/filter/sort/pagination state or JSX remains
- [ ] No transaction-specific `useEffect` hooks remain
- [ ] All imports in Dashboard.tsx are used
- [ ] The word "collapsible" does not appear in Dashboard.tsx
- [ ] Dashboard renders the final layout: Hero → KPI → Cash Flow + Snapshot → Transactions + Goals → Budgets + Insights
- [ ] No visual regressions in any section
- [ ] All existing business logic hooks still execute without error
- [ ] `CollapsibleSection.tsx` still exists (used elsewhere in the app)

---

## Phase 7 — Animation + Dark Mode Polish

**Purpose:** Improve motion design and fix dark mode visual issues.

### 7a — Animation Improvements

**Files affected:**
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/FinancialHeroCard.tsx`
- `src/components/dashboard/KPIStatCard.tsx`
- All new compact card components

**Changes:**
1. Hero value counter animates from 0 to final value (200-300ms, easeOut)
2. KPI card values counter-animate on mount
3. Progress ring fills with animation (0.6s easeOut)
4. Chart sections use single fade-in (no staggered delays)
5. Progress bars animate once on mount
6. Card hover lift: 2-4px (consistent with design language)
7. Remove redundant entrance animations on components that are always in viewport

**Design language spec:**
- 200-300ms duration
- Smooth easing (`easeOut` or `cubic-bezier(0.16, 1, 0.3, 1)`)
- Counters animate
- Charts fade in once
- Cards lift 2px on hover
- No excessive movement

### 7b — Dark Mode Fix

**Files affected:**
- `src/index.css`

**Changes:**
1. Override `--shadow-md` and `--shadow-lg` in `.dark` to use dark-tinted values:
   - `--shadow-md: 0 4px 12px hsl(222 47% 4% / 0.5)`
   - `--shadow-lg: 0 12px 32px hsl(222 47% 0% / 0.6)`
2. Ensure card backgrounds use layered greys (not pure black)
   - Already `hsl(222 40% 10%)` — good
3. Verify primary color maintains contrast in dark mode

**Business logic affected:** None — CSS-only changes.

**Risk:** Low for both 7a and 7b. Animation changes are additive. CSS changes are scoped to `.dark`.

**Testing checklist (7a):**
- [ ] Hero balance counter animates on page load
- [ ] KPI values counter-animate on page load
- [ ] Progress rings animate on mount
- [ ] Progress bars animate on mount
- [ ] Charts fade in once (not on every navigation)
- [ ] Card hover lifts 2-4px consistently
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Animation duration feels smooth, not janky

**Testing checklist (7b):**
- [ ] Dark mode cards have subtle shadow, not colored halo
- [ ] Dark mode card background is lighter than page background
- [ ] Light mode shadows remain unchanged
- [ ] Toggle between light/dark produces correct shadow change
- [ ] All cards in all sections look correct in dark mode
- [ ] Chart tooltips are readable in dark mode

---

## Phase 8 — Responsive + Edge Cases

**Purpose:** Ensure the dashboard works correctly at all breakpoints and handles all data states.

**Files affected:**
- `src/pages/Dashboard.tsx`
- Various new component files

### 8a — Responsive Layout

**Breakpoint behavior:**

| Breakpoint | Layout |
|---|---|
| ≥ 1280px (desktop) | Full 12-column grid, sidebar visible |
| 1024-1279px (small desktop) | 12-column grid, sidebar collapsed |
| 768-1023px (tablet) | 8-column grid, Hero full width, KPIs 2x2, charts stack, widgets stack |
| 480-767px (large phone) | 4-column grid, single column stack, compact cards |
| < 480px (small phone) | Single column, minimal padding, hidden secondary info |

**Changes per component:**
- `FinancialHeroCard`: stacks vertically on tablet, actions become icon-only on mobile
- `KPIStatCard`: 2x2 grid on tablet, full width on mobile
- Charts: full width below lg
- CompactBudgetCard/CompactGoalCard: 1 column on mobile, 2 on tablet
- `CompactTransactionItem`: hide category on mobile

### 8b — Data States

Ensure every widget handles:
- **Loading:** All data is synchronous from Zustand, so no loading state is needed for individual widgets. The existing `PageSkeleton` lazy-load fallback is sufficient.
- **Empty:** Each widget shows appropriate empty state when data is absent:
  - Hero: shows ₦0.00 balance
  - Income/Expenses/Savings KPIs: shows ₦0.00
  - Budget Health KPI: shows "No budgets" text
  - Cash Flow chart: shows empty chart or "No data" message
  - Recent Transactions: shows "No recent transactions"
  - Savings Goals: shows "No goals set"
  - Budgets: shows "No budgets created"
  - Insights: shows "No insights yet"
- **Error:** Dashboard does not have error states (data is local/synchronous). No changes needed.

**Business logic affected:** None — pure UI changes.

**Risk:** Low-medium. Responsive testing is time-consuming but not structurally risky.

**Testing checklist (8a):**
- [ ] At 1440px: full grid, no horizontal scroll
- [ ] At 1920px: content constrained to 1440px max-width
- [ ] At 1024px: sidebar collapses, layout adapts
- [ ] At 768px: Hero full width, KPIs 2x2, charts full width
- [ ] At 480px: single column, cards compact
- [ ] At 375px: readable, no overflow, touch targets ≥ 44px
- [ ] Transaction list hides category on mobile
- [ ] Quick action buttons become icon-only on mobile
- [ ] No horizontal scrollbar at any breakpoint

**Testing checklist (8b):**
- [ ] Fresh account (no data): all sections show correct empty states
- [ ] Only transactions (no budgets/goals): charts render, budget/goal sections empty
- [ ] Only budgets: budget section renders, goals section empty
- [ ] Only goals: goals section renders, budget section empty
- [ ] Large data set: Hero shows compact formatting for large numbers
- [ ] Negative values: expenses show correctly, overspent budgets show correctly
- [ ] Very long budget/goal names: truncated with ellipsis

---

## Phase 9 — Final Cleanup + Verification

**Purpose:** Remove dead code, verify imports, confirm no regressions.

**Files affected:**
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/StatCard.tsx` (if no longer used on dashboard — may still be reused elsewhere)
- Any other files with stale imports

**Checklist:**
- [ ] All unused imports are removed from Dashboard.tsx
- [ ] All unused state variables are removed
- [ ] All unused `useMemo`/`useEffect` hooks are removed
- [ ] `StatCard.tsx` is either removed or confirmed used elsewhere
- [ ] `CollapsibleSection.tsx` is either removed or confirmed used elsewhere
- [ ] `useDashboardMetrics()` is still the single source of metric computation
- [ ] No duplicate data fetching or selector subscriptions
- [ ] `DashboardTransactionFilter` and `DashboardTransactionSort` types in `utils.ts` are either removed or confirmed used elsewhere
- [ ] `filterAndSortTransactions` and `paginateTransactions` in `utils.ts` are either removed or confirmed used elsewhere

**Business logic verification:**
- [ ] All transactions are still loaded from Zustand store
- [ ] All budgets are still loaded from Zustand store
- [ ] All goals are still loaded from Zustand store
- [ ] All accounts are still loaded from Zustand store
- [ ] `formatNaira` still formats correctly
- [ ] Date formatting still works
- [ ] Theme toggle still works
- [ ] Sidebar navigation still works
- [ ] Empty states correctly link to creation pages
- [ ] "View All" links correctly navigate to dedicated pages

---

## Phase Dependency Diagram

```
Phase 1 (UI Primitives)
  │
  ▼
Phase 2 (Hero Card)
  │
  ▼
Phase 3 (Simplify Dashboard)  ──┐
                                │
Phase 4 (Layout Restructure)  ◄─┘
  │
  ▼
Phase 5 (Remove StatCard Row)
  │
  ▼
Phase 6 (Remove Collapsible Sections)
  │
  ▼
Phase 7 (Animations + Dark Mode)
  │
  ▼
Phase 8 (Responsive + Edge Cases)
  │
  ▼
Phase 9 (Final Cleanup)
```

**Independent work possible:**
- Phase 1a-1h can be done in parallel
- Phase 2 needs Phase 1e (QuickActionCard) but can be developed concurrently with a temporary inline version
- Phase 3 can start once Phase 1 is complete
- Phase 7b (dark mode CSS) can be done at any time

---

## Rollback Strategy

Each phase produces a working commit. If a phase introduces issues:

- **Phase 1:** Revert individual component file — no other files affected
- **Phase 3:** Revert Dashboard.tsx changes only (old sections are removed, no structural changes)
- **Phase 4:** Revert Dashboard.tsx to Phase 3 state (layout changed but data flow unchanged)
- **Phase 5:** Revert Dashboard.tsx to Phase 4 state (stat cards removed but can be re-added)
- **Phase 6:** Revert Dashboard.tsx to Phase 5 state (collapsible sections removed)
- **Phase 7:** Revert CSS changes or animation code independently
- **Phase 8:** Revert individual component responsive changes
- **Phase 9:** Revert cleanup (no functional impact)

No phase requires migrating or rolling back database schema, store shapes, or API contracts.
