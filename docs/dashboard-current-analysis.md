# Kobo Dashboard — Current Implementation Analysis

**File:** `src/pages/Dashboard.tsx`  
**Route:** `/dashboard`  
**Framework:** React 18 + TypeScript + Tailwind CSS + Framer Motion + Recharts  
**State:** Zustand (finance store)  
**Auth:** Firebase via AuthContext  
**Date:** 2026-07-21  

---

## 1. Overall Page Layout

### Page Hierarchy (top to bottom)

```
PageHeader (h1 greeting + subtitle + action buttons)
  │
  ├── Empty State (if no transactions exist → full-page, exits early)
  │
  └── [Content when transactions exist]
       │
       ├── StatCard Grid (5 summary cards)
       │   grid-cols-1 sm:grid-cols-2 xl:grid-cols-5
       │
       ├── Chart Row 1 (2 columns)
       │   ├── Income vs Expenses (Bar Chart)
       │   └── Cash Flow (Area Chart)
       │   grid-cols-1 lg:grid-cols-2
       │
       ├── Chart Row 2 (2 columns)
       │   ├── Spending by Category (Donut Pie Chart)
       │   └── Budget Health (inline mini-budget cards)
       │   grid-cols-1 lg:grid-cols-2
       │
       ├── CollapsibleSection: Savings Goals
       │   └── Monthly Contributions (Bar Chart) + GoalCard Grid
       │   grid-cols-1 sm:grid-cols-2 xl:grid-cols-3
       │
       ├── CollapsibleSection: Current Budgets
       │   └── BudgetCard Grid
       │   grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
       │
       └── CollapsibleSection: Recent Transactions
           └── Table (search, filter, sort, paginate)
```

### Grid Structure

| Section | Breakpoints | Columns |
|---|---|---|
| Stat Cards | default / sm / xl | 1 / 2 / 5 |
| Charts (row 1 & 2) | default / lg | 1 / 2 |
| Goals grid | default / sm / xl | 1 / 2 / 3 |
| Budget grid | default / sm / xl / 2xl | 1 / 2 / 3 / 4 |
| Budget Health mini-grid | default / sm | 1 / 2 |

### Column Layout

- Single-column layout below `lg` (mobile/tablet).
- Two-column layout at `lg` for charts, goals, budgets.
- Five-column layout at `xl` for stat cards only.
- Four-column layout at `2xl` for budget cards.
- Page is full-width within the main content area (`<main id="main-content" class="p-4 sm:p-6 lg:p-8">`).
- No container max-width constraint — content stretches to sidebar boundary.

### Section Ordering

1. Page Header (greeting + actions)
2. Summary Stat Cards (5 cards, always visible)
3. Primary Charts (Income vs Expenses + Cash Flow)
4. Secondary Charts (Spending by Category + Budget Health)
5. Savings Goals (collapsible, default collapsed)
6. Current Budgets (collapsible, default expanded)
7. Recent Transactions (collapsible, default expanded)

### Visual Flow

- Top-down left-to-right scanning pattern.
- Stat cards form the hero/critical-viewport zone.
- Charts are the secondary visual mass.
- Collapsible sections allow progressive disclosure below the fold.
- All sections are same width — no sidebar, no aside, no breakout panels.

### Information Density

- **High density.** One full viewport shows: header, 5 stat cards, 2 charts.
- Full page requires approximately 3–4 viewport scrolls on a 1080p screen.
- 10 distinct content zones (header + stat cards + 2 chart rows + 3 collapsible sections).
- 5 Recharts chart instances + 5 sparkline charts on StatCards = 10 chart SVGs.

### Scroll Behavior

- Full-page vertical scroll. No horizontal scroll except transaction table (overflow-x-auto).
- No sticky elements within dashboard content (sticky header is in AppLayout, not dashboard).
- Each section scrolls into view naturally.
- Framer Motion entrance animations fire on initial mount; re-fire on unmount/remount.

### White Space Usage

- Page sections: `space-y-8` (2rem / 32px between sections).
- Card padding: `p-5` (1.25rem / 20px).
- Grid gaps: `gap-4` (1rem / 16px).
- Table cells: `px-5 py-3`.
- No variation in section spacing — all gaps are identical.
- Collapsible sections add `pt-4` above content.

### Alignment

- Left-aligned headings and all text content.
- Right-aligned monetary values (transaction amounts, stat values).
- Center-aligned chart containers and empty states.
- Icon boxes within cards are centered grid items.

### Grouping

- Stat cards grouped visually as a horizontal row via same-height grid.
- Chart pairs grouped in two-column rows.
- Collapsible sections group related content under titled headings.
- Budget Health section uses inline mini-cards within a card.
- Savings Goals section groups the Monthly Contributions chart + GoalCards.

---

## 2. Summary Cards (StatCard)

**Component:** `src/components/dashboard/StatCard.tsx`  
**Count:** 5 cards  
**Container:** `grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5`

### Card-by-Card Breakdown

#### Card 1: Total Balance
| Field | Value |
|---|---|
| Title | "Total Balance" |
| Icon | Wallet (lucide-react) |
| Data | `totalBalance` (number, formatted via `formatNaira`) |
| Delta | 4.2% positive |
| Variant | `balance` — purple gradient icon box |
| Sparkline | Balance series (computed from monthly chart cumulative) |
| Visual importance | Highest — first card, most prominent metric |
| Essential or secondary | **Essential** |

#### Card 2: Income (Month)
| Field | Value |
|---|---|
| Title | "Income (Month)" |
| Icon | TrendingUp |
| Data | `income` — current month-to-date income |
| Delta | 8.6% positive |
| Variant | `income` — green gradient icon box |
| Sparkline | Income values from monthly chart |
| Essential or secondary | **Essential** |

#### Card 3: Expenses (Month)
| Field | Value |
|---|---|
| Title | "Expenses (Month)" |
| Icon | TrendingDown |
| Data | `expenses` — current month-to-date expenses |
| Delta | -3.1% negative (red) |
| Variant | `expense` — red gradient icon box |
| Sparkline | None (no data prop passed) |
| Essential or secondary | **Essential** |

#### Card 4: Cash Saved (Month)
| Field | Value |
|---|---|
| Title | "Cash Saved (Month)" |
| Icon | PiggyBank |
| Data | `savings` — income minus expenses for current month |
| Delta | 12.4% positive |
| Variant | `savings` — blue gradient icon box |
| Sparkline | None |
| Essential or secondary | **Secondary** — derived from income - expenses |

#### Card 5: Total Saved
| Field | Value |
|---|---|
| Title | "Total Saved" |
| Icon | Target |
| Data | `totalSaved` — cumulative savings across all goals |
| Delta | 0% (hardcoded, no trend) |
| Variant | `goals` — purple-violet gradient icon box |
| Sparkline | None |
| Essential or secondary | **Secondary** — overlaps with Cash Saved conceptually |

### Common Card Properties (All 5)

| Property | Implementation |
|---|---|
| Size | Full grid column width, responsive. Fixed aspect ratio via content height. |
| Background | `bg-card` (white / dark surface) |
| Border | `border border-border` with `rounded-xl` (12px radius) |
| Shadow | `shadow-elegant` (`--shadow-md`: 0 4px 12px hsl(222 47% 11% / 0.08)) |
| Hover effect | `whileHover={{ y: -4 }}` with `hover:shadow-elevated` transition |
| Animation | `initial={{ opacity: 0, y: 12 }}` → `animate={{ opacity: 1, y: 0 }}` |
| Icon box size | `h-11 w-11` (44px), `rounded-xl` |
| Icon size | `h-5 w-5` (20px) |
| Value typography | `font-display text-2xl sm:text-3xl font-bold tracking-tight tabular-nums` |
| Label typography | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| Delta badge | Inline flex, `rounded-full px-2 py-0.5 text-xs font-medium` |
| Delta colors | Positive: `bg-success/10 text-success` / Negative: `bg-destructive/10 text-destructive` |
| Sparkline | Optional `data` prop; renders `<ResponsiveContainer>` at `max-w-[140px] h-10` |

### Visual Distinction Between Cards

Cards are differentiated by:
- Icon (5 different lucide icons)
- Icon box gradient color (5 different gradients)
- Label text
- Value display
- Delta percentage

---

## 3. Charts

### Chart 1: Income vs Expenses
| Property | Value |
|---|---|
| Type | Grouped vertical bar chart (Recharts `<BarChart>`) |
| Purpose | Compare income and expenses over time |
| Metrics | Income (green bars), Expenses (red bars) |
| Data source | `monthlyChart` — `getMonthlyChart(transactions)` from finance store |
| Time range | Last 6 months |
| Filters | None (hardcoded 6 months) |
| Size | `h-72` (288px), full column width |
| Placement | Chart Row 1, column 1 |
| User interactions | Hover tooltip (custom `TOOLTIP_STYLES`), legend toggle |
| X-axis | Month labels (`month` key) |
| Y-axis | Compact Naira values |
| Bar radius | `radius={[6, 6, 0, 0]}` — rounded top corners |
| Unique question | Yes — primary income vs. expense comparison |

### Chart 2: Cash Flow
| Property | Value |
|---|---|
| Type | Area chart (Recharts `<AreaChart>`) with gradient fill |
| Purpose | Show net income trend each month |
| Metrics | Net cash flow (income - expenses per month) |
| Data source | `cashFlow` — derived from `monthlyChart` via `getCashFlow()` |
| Time range | Last 6 months |
| Filters | None |
| Size | `h-72` (288px), full column width |
| Placement | Chart Row 1, column 2 |
| User interactions | Hover tooltip |
| Gradient | Teal-green (`hsl(159 64% 45%)`) with 50% → 0% opacity |
| Stroke width | 3px |
| Unique question | Yes — shows net trend, different from income vs. expenses |

### Chart 3: Spending by Category
| Property | Value |
|---|---|
| Type | Donut pie chart (Recharts `<PieChart>` with `innerRadius={45}`, `outerRadius={75}`) |
| Purpose | Show expense distribution by category |
| Metrics | Expense amounts grouped by category |
| Data source | `categoryData` — `getCategoryBreakdown(transactions)` |
| Time range | All-time (no date filter) |
| Filters | None |
| Size | `h-56` (224px) |
| Placement | Chart Row 2, column 1 |
| User interactions | Hover tooltip |
| Color palette | 10-color COLORS array (teal, blue, amber, red, purple, violet, green, orange, cyan, mint) |
| Legend | Inline list below chart showing top 4 categories with color dots |
| Empty state | "No spending this month" centered text |
| Unique question | Yes — distribution breakdown |

### Chart 4: Budget Health (inline mini-cards)
| Property | Value |
|---|---|
| Type | Not a Recharts chart — inline mini-cards with CSS progress bars |
| Purpose | Show status of each budget's spending progress |
| Metrics | Budget name, percentage used, remaining/overspent amount |
| Data source | `budgetsWithProgress` from `useBudgetsPage()` |
| Filters | Shows first 6 budgets |
| Size | Dynamic — fills column height |
| Placement | Chart Row 2, column 2 |
| User interactions | None (cards are not clickable) |
| Progress bar colors | Green (< 75%), Warning/Amber (75-99%), Red (≥ 100%) |
| Empty state | "No budgets created yet" centered text |
| Unique question | Yes — budget tracking (different from spending breakdown) |

### Chart 5: Monthly Contributions (Savings)
| Property | Value |
|---|---|
| Type | Vertical bar chart (Recharts `<BarChart>`) |
| Purpose | Show savings contributions over time |
| Metrics | Contributions per month (purple bars) |
| Data source | `monthlySavings` — `getMonthlyGoalSavings(goals, transactions)` |
| Time range | Last 6 months |
| Filters | None |
| Size | `h-64` (256px), full width |
| Placement | Inside CollapsibleSection "Savings Goals", above GoalCards |
| User interactions | Hover tooltip |
| Bar color | Purple (`hsl(280 75% 65%)`) |
| Unique question | Yes — savings-specific metric not shown elsewhere |

### Chart Redundancy Note

- The Monthly Expenses line chart that previously existed in the codebase (as documented in `dashboard-audit.md`) has been removed. The current dashboard does not contain a standalone Monthly Expenses line chart.
- `totalBalance` and `availableBalance` are both computed from `getCurrentBalance`/`getAvailableBalance` but `availableBalance` is not rendered in the UI — only `totalBalance` is shown.
- `Cash Saved (Month)` and `Total Saved` are related but serve different time windows (monthly vs. cumulative goal-based).

---

## 4. Lists

### Recent Transactions Table
| Property | Value |
|---|---|
| Component | Inline table in `Dashboard.tsx` |
| Location | Last collapsible section |
| Visible items | 5 per page (`pageSize = 5`) |
| Columns | Description (icon + text + type label), Category (badge), Account (hidden below md), Date (hidden below sm), Amount |
| Data source | `recentTransactions` (full transaction array from store) |
| Search | Text input filtering by description, category, account |
| Filter dropdown | All / Income / Expense / Transfer |
| Sort dropdown | Newest / Oldest / Highest / Lowest |
| Pagination | Previous/Next buttons, page counter "Page X of Y" |
| Empty state | "No transactions match your search" in table body |
| Row interaction | Hover highlight (`hover:bg-muted/30`) |
| Amount formatting | Green with "+" for income, default with "−" for expense |

### Budget Health Mini-Cards
| Property | Value |
|---|---|
| Component | Inline rendered in `Dashboard.tsx` within the Budget Health card |
| Location | Chart Row 2, column 2 |
| Visible items | Up to 6 budgets |
| Each card shows | Budget name, percentage, progress bar, remaining/overspent text |
| Data source | `budgetsWithProgress` from `useBudgetsPage()` |
| Actions | None (read-only) |
| Navigation | "Manage Budgets" button below collapsible section |
| Empty state | "No budgets created yet" centered text |

### Goal Cards
| Property | Value |
|---|---|
| Component | `GoalCard` from `src/components/savings/GoalCard.tsx` |
| Location | Inside CollapsibleSection "Savings Goals" |
| Grid | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` |
| Visible items | All goals (no limit) |
| Each card shows | Icon, name, funding type, target amount, tags, progress %, health score, saved/remaining amounts, days left, daily stats, contribution button |
| Data source | `goals` from store, enriched with `calculateGoalMetrics()` |
| Actions (dropdown) | Add Contribution, Edit Goal, View Transactions, View Analytics, Delete Goal |
| Navigation | "Create Goal" CTA in empty state |
| Empty state | `EmptyState` with Target icon, "No savings goals", compact mode |

### Budget Cards
| Property | Value |
|---|---|
| Component | `BudgetCard` from `src/components/budgets/BudgetCard.tsx` |
| Location | Inside CollapsibleSection "Current Budgets" |
| Grid | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` |
| Visible items | Up to 8 budgets |
| Each card shows | Icon, name, period, categories, days remaining, status badge, progress bar with shimmer, spent vs budget, percentage used, remaining/overspent, detailed metrics panel, insights panel |
| Data source | `budgetsWithProgress` from `useBudgetsPage()` |
| Actions (dropdown) | View Transactions, Show/Hide Insights, Edit Budget, Delete Budget |
| Toggle | "Show insights & forecast" button expands BudgetInsightsPanel |
| Navigation | "Manage Budgets" button above card grid |
| Empty state | `EmptyState` with PieChart icon, "No budgets yet" |

---

## 5. Quick Actions

### Action 1: View Reports
| Property | Value |
|---|---|
| Location | PageHeader, right side |
| Component | `Button variant="outline"` |
| Label | "View Reports" |
| Navigation | Link to `/reports` |
| Visibility | Always visible when transactions exist |
| Accessibility | Standard button + react-router Link |
| Frequency | Secondary — used for deeper analysis |

### Action 2: New Transaction
| Property | Value |
|---|---|
| Location | PageHeader, right side (primary button) |
| Component | `Button` (default/primary variant) |
| Label | "New Transaction" with `Plus` icon |
| Navigation | Link to `/transactions` |
| Visibility | Always visible when transactions exist |
| Accessibility | Standard button + react-router Link |
| Frequency | High — primary data entry action |

### Action 3: Manage Budgets
| Property | Value |
|---|---|
| Location | Inside CollapsibleSection "Current Budgets", top |
| Component | `Button variant="outline"` |
| Label | "Manage Budgets" |
| Navigation | Link to `/budgets` |
| Visibility | Always visible when section is expanded and budgets exist |
| Frequency | Medium |

### Action 4: Create Goal
| Property | Value |
|---|---|
| Location | Inside CollapsibleSection "Savings Goals" empty state |
| Component | `Button` inside `EmptyState` |
| Label | "Create Goal" |
| Navigation | Window redirect to `/goals` |
| Visibility | Only when no goals exist |
| Frequency | Low (one-time setup) |

### Action 5: Go to Budgets
| Property | Value |
|---|---|
| Location | Inside CollapsibleSection "Current Budgets" empty state |
| Component | `Button` inside `EmptyState` |
| Label | "Go to Budgets" |
| Navigation | Window redirect to `/budgets` |
| Visibility | Only when no budgets exist |
| Frequency | Low (one-time setup) |

### Action 6: Add Transaction (Global)
| Property | Value |
|---|---|
| Location | Sticky header in AppLayout |
| Component | `Button size="sm"` |
| Label | "Add Transaction" with `Plus` icon |
| Navigation | Opens `TransactionFormDialog` modal via Zustand `useTransactionModal` |
| Visibility | Always visible (hidden below `sm`) |
| Frequency | High |

---

## 6. Navigation

### Header (AppLayout — `src/components/layout/AppLayout.tsx`)
| Property | Value |
|---|---|
| Position | Sticky top (`sticky top-0 z-30`) |
| Height | `h-16` (64px) |
| Background | `bg-background/80 backdrop-blur-md` — glassmorphism effect |
| Border | `border-b border-border` |
| Left | Hamburger menu button (mobile only, `lg:hidden`) |
| Center-left | Global search bar (`hidden md:block`, `max-w-md`) |
| Right | "Add Transaction" button, Notification bell, Theme toggle |

### Global Search
| Property | Value |
|---|---|
| Position | Header, `hidden md:block`, `flex-1 max-w-md` |
| Input | `Search` icon, placeholder "Search transactions, budgets, accounts…" |
| Results | Dropdown panel below input, cross-entity search (transactions, budgets, accounts, goals, debts) |
| Empty state | "Try searching for a transaction, budget, account, savings goal, or debt." |
| Clear | X button to clear query |
| Data source | `searchFinanceData()` from features/search |

### Notification Bell
| Property | Value |
|---|---|
| Position | Header, right side |
| Component | Bell icon button |
| Badge | Red dot with unread count (max "99+") |
| Drawer | Lazy-loaded `NotificationDrawer` component |
| Mark read | Single and "mark all read" |
| Delete | Single and "clear all" |

### Theme Switch
| Property | Value |
|---|---|
| Position | Header, rightmost |
| Component | Moon/Sun icon toggle button |
| Cycle | light → dark → system → light |
| State | Zustand `settings.appearance.theme` |

### Sidebar (`src/components/layout/Sidebar.tsx`)
| Property | Value |
|---|---|
| Position | Fixed left, full height |
| Width | `w-64` expanded, `w-20` collapsed |
| Background | `bg-sidebar` (dark navy: `222 47% 11%`) |
| Items | 9 navigation links |
| Active state | Animated `layoutId` indicator bar, accent background |
| Collapse toggle | ChevronLeft button, rotates on collapse |
| Mobile behavior | Off-screen (`-translate-x-full`), overlay with backdrop blur when open |
| Bottom section | User avatar (initials), display name, "Free Plan" badge |

### Sidebar Navigation Items
| Order | Item | Icon | Route |
|---|---|---|---|
| 1 | Dashboard | LayoutDashboard | `/dashboard` |
| 2 | Transactions | ArrowLeftRight | `/transactions` |
| 3 | Budgets | PieChart | `/budgets` |
| 4 | Savings Goals | Target | `/goals` |
| 5 | Debts | CreditCard | `/debts` |
| 6 | Accounts | Landmark | `/accounts` |
| 7 | Wallets | Wallet | `/wallets` |
| 8 | Reports | BarChart3 | `/reports` |
| 9 | Settings | Settings | `/settings` |

---

## 7. Dashboard Information Hierarchy

### Eye Path (top to bottom, left to right)

1. **Page greeting** — "Welcome back, {name}" — largest text on page (`text-2xl sm:text-3xl font-bold`)
2. **Stat Card 1: Total Balance** — first card in row, purple gradient, most prominent numeric value
3. **Stat Cards 2-5** — scanned left to right across the 5-card row
4. **Income vs Expenses chart** — first chart, large bar chart, green + red bars
5. **Cash Flow chart** — adjacent to income vs expenses, green area fill
6. **Spending by Category** — donut chart with color slices
7. **Budget Health** — inline progress bars

### Attention Competition

- **Total Balance card** vs **Income card** — both in the stat row, same visual weight. Balance is first but Income has a higher delta (8.6% vs 4.2%).
- **Income vs Expenses chart** vs **Cash Flow chart** — same size, same row. Cash flow is derived from the same data, creating redundancy.
- **Spending by Category** vs **Budget Health** — same row, different data. Both are secondary.
- **Stat cards** collectively dominate the initial viewport (5 colorful cards in a row).
- **Collapsible sections** have equal heading weight — no visual differentiation between goals, budgets, and transactions.

### Visually Weak Sections

- **Chart subtitle text** — `text-xs text-muted-foreground` is 12px, may be hard to read.
- **Budget Health mini-cards** — small text, dense layout, no hover interaction.
- **Transaction table row icons** — small (h-4 w-4), subtle color differentiation.
- **Pagination controls** — at the bottom of the page, easily overlooked.

### Page-Dominant Elements

- **Stat card row** — 5 colorful cards with gradient icon boxes and large values.
- **Income vs Expenses bar chart** — largest chart (h-72), first chart, most color contrast (green vs red).

---

## 8. Visual Analysis

### Typography Hierarchy
| Element | Font Family | Size | Weight |
|---|---|---|---|
| Page title (h1) | Plus Jakarta Sans (display) | `text-2xl sm:text-3xl` | font-bold |
| Section title (h2) | Plus Jakarta Sans (display) | `text-xl` | font-bold |
| Card heading (h3) | Plus Jakarta Sans (display) | `font-display font-semibold` | semibold |
| Stat card label | Inter (sans) | `text-xs` | font-medium uppercase |
| Stat card value | Plus Jakarta Sans (display) | `text-2xl sm:text-3xl` | font-bold |
| Chart subtitle | Inter (sans) | `text-xs` | normal |
| Transaction description | Inter (sans) | `font-medium` | medium |
| Transaction amount | Inter (sans) | `font-semibold` | semibold |
| Table header | Inter (sans) | `text-xs` | font-medium uppercase |
| Badge text | Inter (sans) | `text-xs` | font-normal |
| Empty state title | Plus Jakarta Sans (display) | `text-lg` (normal) / `text-base` (compact) | font-semibold |

### Spacing
| Token | Value | Usage |
|---|---|---|
| Page padding | `p-4 sm:p-6 lg:p-8` | Main content wrapper |
| Section gap | `space-y-8` (32px) | Between major sections |
| Grid gap | `gap-4` (16px) | Between grid items |
| Card padding | `p-5` (20px) | Inside every card |
| Table cell padding | `px-5 py-3` | Table rows |
| Heading bottom margin | `mb-1`, `mb-4` | Small gaps below titles |
| Section heading bottom | `pt-4` | Content below collapsed heading |

### Card Sizing
| Card Type | Width | Height |
|---|---|---|
| StatCard | Full grid column | Content-driven (~150px) |
| Chart card | Full grid column | Min `h-72` + header + padding (~340px) |
| Budget Health card | Full grid column | Content-driven |
| GoalCard | Full grid column | Content-driven (~400px+) |
| BudgetCard | Full grid column | Content-driven (~400px+) |
| Transaction table | Full width | Content-driven |

### Card Consistency
All cards share:
- `rounded-xl border border-border bg-card p-5 shadow-elegant`
- Framer Motion entrance animation (`opacity: 0, y: 8` → `opacity: 1, y: 0`)
- No visual differentiation between primary metrics, secondary charts, and tertiary tables.

### Chart Sizing
| Chart | Container Height | Aspect Ratio (at 2-col) |
|---|---|---|
| Income vs Expenses | `h-72` (288px) | ~1.5:1 |
| Cash Flow | `h-72` (288px) | ~1.5:1 |
| Spending by Category | `h-56` (224px) | ~2:1 |
| Monthly Contributions | `h-64` (256px) | ~3:1 (full width) |

### Color Usage
| Color | HSL Value | Usage |
|---|---|---|
| Primary (teal) | `159 64% 36%` | Buttons, links, primary accent |
| Success (green) | `142 71% 45%` | Income, progress bars, positive deltas |
| Destructive (red) | `0 72% 51%` | Expenses, overspent budgets, negative deltas |
| Warning (amber) | `38 92% 50%` | Budget near limit |
| Info (blue) | `217 91% 60%` | Savings card accent |
| Balance (purple) | `259 80% 60%` | Balance card accent |
| Goals (violet) | `280 75% 65%` | Goals card, contributions chart |
| COLORS array | 10 hardcoded HSL values | Pie chart slices |

### Shadow Usage
| Token | Value | Applied To |
|---|---|---|
| `shadow-elegant` | `--shadow-md` (4px, 12px) | All cards |
| `shadow-elevated` | `--shadow-lg` (12px, 32px) | Cards on hover |
| `shadow-glow` | `--shadow-glow` (8px, 24px) | Sidebar logo only |
| `shadow-sm` | `--shadow-sm` (1px, 2px) | Not used in dashboard |

### Border Radius
| Token | Value | Applied To |
|---|---|---|
| `rounded-xl` | 12px (`--radius: 0.75rem`) | All cards, icon boxes |
| `rounded-lg` | 10px (`--radius - 2px`) | Inputs, dropdowns, secondary containers |
| `rounded-md` | 8px (`--radius - 4px`) | Buttons, small elements |
| `rounded-full` | 9999px | Badges, progress bar containers |

### Glassmorphism
| Element | Implementation |
|---|---|
| Sticky header | `bg-background/80 backdrop-blur-md` |
| Mobile sidebar overlay | `bg-foreground/40 backdrop-blur-sm` |
| Notification drawer | Not visible in dashboard directly (in AppLayout) |

### Icons
- All icons from `lucide-react` library.
- Stat cards: Wallet, TrendingUp, TrendingDown, PiggyBank, Target.
- Charts section: No icons in headings.
- Transaction table: ArrowUpRight (income), ArrowDownRight (expense).
- Collapsible sections: ChevronDown (rotates -90deg when collapsed).
- Budget icons: Map from iconMap (food→Utensils, transport→Bus, etc.).
- Empty state icons: BarChart3, Target, PieChart.
- Sidebar: LayoutDashboard, ArrowLeftRight, PieChart, Target, CreditCard, Landmark, Wallet, BarChart3, Settings.

### Animations
| Element | Animation |
|---|---|
| PageHeader | `opacity: 0, y: -8` → `opacity: 1, y: 0` |
| Stat cards | `opacity: 0, y: 12` → `opacity: 1, y: 0` (staggered via motion) |
| Stat card hover | `y: -4` |
| Chart sections | `opacity: 0, y: 8` → `opacity: 1, y: 0` (delays: 0, 0.1, 0.15, 0.2) |
| Collapsible sections | Height animate from 0 to auto (0.25s easeInOut) |
| Empty states | `opacity: 0, y: 16` → `opacity: 1, y: 0` |
| GoalCard hover | `y: -4` |
| BudgetCard hover | `y: -3` |
| BudgetCard progress bar | Width animates from 0 to target (0.9s easeOut) |
| Sidebar active indicator | `layoutId="sidebar-active"` spring animation |
| Chart entrance | `animationBegin={0}`, `animationDuration={800}` (Recharts built-in) |

### Whitespace
- Generous `space-y-8` between sections.
- Adequate `gap-4` in grids.
- 20px padding inside all cards.
- No whitespace variation — identical rhythm throughout.

### Responsive Behavior
| Breakpoint | Layout Changes |
|---|---|
| Default (< 640px) | 1-column stat cards, 1-column charts, 1-column goals, 1-column budgets, hidden Account/Date columns in table |
| sm (640px) | 2-column stat cards, 2-column Budget Health, 2-column goals |
| md (768px) | Account column visible in table, global search hidden |
| lg (1024px) | 2-column charts, 3-column budgets, sidebar visible, 2-column goals |
| xl (1280px) | 5-column stat cards, 3-column goals |
| 2xl (1536px) | 4-column budgets |

---

## 9. Dashboard Content Inventory

| Widget | Name | Purpose | Required | Optional | Movable | Must Remain Visible | Can Redesign |
|---|---|---|---|---|---|---|---|
| 1 | PageHeader | Greeting + primary actions | Yes | No | No | Yes | Yes |
| 2 | StatCard: Total Balance | Show total balance across all accounts | Yes | No | Within stat row | Yes | Yes |
| 3 | StatCard: Income (Month) | Show month-to-date income | Yes | No | Within stat row | Yes | Yes |
| 4 | StatCard: Expenses (Month) | Show month-to-date expenses | Yes | No | Within stat row | Yes | Yes |
| 5 | StatCard: Cash Saved (Month) | Show monthly savings | Yes | Yes (derived) | Within stat row | No | Yes |
| 6 | StatCard: Total Saved | Show cumulative goal savings | Yes | Yes (overlaps with #5) | Within stat row | No | Yes |
| 7 | Chart: Income vs Expenses | Compare income/expenses over 6 months | Yes | No | In chart row | Yes | Yes |
| 8 | Chart: Cash Flow | Show net income trend | Yes | No | In chart row | Yes | Yes |
| 9 | Chart: Spending by Category | Expense category breakdown | Yes | No | In chart row | Yes | Yes |
| 10 | Chart (pseudo): Budget Health | Budget progress overview | Yes | Yes (if no budgets) | In chart row | No | Yes |
| 11 | Chart: Monthly Contributions | Savings contribution trend | No | Yes | In goals section | No | Yes |
| 12 | Section: Savings Goals | List of goals with progress | Yes | Yes (no goals → empty) | As collapsible | No | Yes |
| 13 | Section: Current Budgets | List of budgets with details | Yes | Yes (no budgets → empty) | As collapsible | No | Yes |
| 14 | Section: Recent Transactions | Searchable transaction table | Yes | No | As collapsible | Yes | Yes |

---

## 10. Dashboard Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AppLayout                                   │
│  ┌──────────┐  ┌────────────────────────────────────────────┐  │
│  │          │  │  ┌─────────────────────────────────┐        │  │
│  │ Sidebar  │  │  │  Sticky Header (AppLayout)      │        │  │
│  │          │  │  │  [Menu] [Global Search] [Notif]  │        │  │
│  │ ● Dashboard│  │  │  [Theme] [Add Transaction]     │        │  │
│  │ ● Transact.│  │  └─────────────────────────────────┘        │  │
│  │ ● Budgets │  │                                              │  │
│  │ ● Goals   │  │  ┌─────────────────────────────────┐        │  │
│  │ ● Debts   │  │  │  Dashboard (Outlet)             │        │  │
│  │ ● Accounts│  │  │  ┌─────────────────────────┐    │        │  │
│  │ ● Wallets │  │  │  │ PageHeader              │    │        │  │
│  │ ● Reports │  │  │  │ "Welcome back, {name}"  │    │        │  │
│  │ ● Settings│  │  │  │ [View Reports] [New Tx]  │    │        │  │
│  │          │  │  │  └─────────────────────────┘    │        │  │
│  │ [User]   │  │  │                                  │        │  │
│  │ Free Plan│  │  │  ┌─────────────────────────┐    │        │  │
│  └──────────┘  │  │  │ Stat Cards (1×5 grid)    │    │        │  │
│                │  │  │ [Balance][Income]        │    │        │  │
│                │  │  │ [Expense][Saved][Total]  │    │        │  │
│                │  │  └─────────────────────────┘    │        │  │
│                │  │                                  │        │  │
│                │  │  ┌─────────────────────────┐    │        │  │
│                │  │  │ Chart Row 1 (2-col)      │    │        │  │
│                │  │  │ ┌──────────┐┌──────────┐│    │        │  │
│                │  │  │ │Income vs ││Cash Flow ││    │        │  │
│                │  │  │ │Expenses  ││(Area)    ││    │        │  │
│                │  │  │ └──────────┘└──────────┘│    │        │  │
│                │  │  └─────────────────────────┘    │        │  │
│                │  │                                  │        │  │
│                │  │  ┌─────────────────────────┐    │        │  │
│                │  │  │ Chart Row 2 (2-col)      │    │        │  │
│                │  │  │ ┌──────────┐┌──────────┐│    │        │  │
│                │  │  │ │Spending  ││Budget    ││    │        │  │
│                │  │  │ │by Cat    ││Health    ││    │        │  │
│                │  │  │ │(Donut)   ││(Mini-    ││    │        │  │
│                │  │  │ │          ││cards)    ││    │        │  │
│                │  │  │ └──────────┘└──────────┘│    │        │  │
│                │  │  └─────────────────────────┘    │        │  │
│                │  │                                  │        │  │
│                │  │  ┌─ CollapsibleSection ────────┐ │        │  │
│                │  │  │ ▼ Savings Goals             │ │        │  │
│                │  │  │  ┌──────────────────────┐   │ │        │  │
│                │  │  │  │ Monthly Contrib. Bar  │   │ │        │  │
│                │  │  │  └──────────────────────┘   │ │        │  │
│                │  │  │  ┌──────────────────────┐   │ │        │  │
│                │  │  │  │ GoalCard Grid (1-3col)│   │ │        │  │
│                │  │  │  │ [Goal1] [Goal2] [G3] │   │ │        │  │
│                │  │  │  └──────────────────────┘   │ │        │  │
│                │  │  └──────────────────────────────┘ │        │  │
│                │  │                                  │        │  │
│                │  │  ┌─ CollapsibleSection ────────┐ │        │  │
│                │  │  │ ▼ Current Budgets           │ │        │  │
│                │  │  │ [Manage Budgets]            │ │        │  │
│                │  │  │  ┌──────────────────────┐   │ │        │  │
│                │  │  │  │ BudgetCard Grid       │   │ │        │  │
│                │  │  │  │ (1-4 col) [B1][B2]   │   │ │        │  │
│                │  │  │  │ [B3][B4] ...         │   │ │        │  │
│                │  │  │  └──────────────────────┘   │ │        │  │
│                │  │  └──────────────────────────────┘ │        │  │
│                │  │                                  │        │  │
│                │  │  ┌─ CollapsibleSection ────────┐ │        │  │
│                │  │  │ ▼ Recent Transactions       │ │        │  │
│                │  │  │  ┌──────────────────────┐   │ │        │  │
│                │  │  │  │ [Search] [Filter]    │   │ │        │  │
│                │  │  │  │ [Sort]               │   │ │        │  │
│                │  │  │  ├──────────────────────┤   │ │        │  │
│                │  │  │  │ Table (5 rows)       │   │ │        │  │
│                │  │  │  │ Desc | Cat | Amt    │   │ │        │  │
│                │  │  │  ├──────────────────────┤   │ │        │  │
│                │  │  │  │ Pagination           │   │ │        │  │
│                │  │  │  └──────────────────────┘   │ │        │  │
│                │  │  └──────────────────────────────┘ │        │  │
│                │  └─────────────────────────────────┘        │  │
│  ┌──────────┐  └────────────────────────────────────────────┘  │
│  │  Footer  │  (none)                                           │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Data Relationships

### How Dashboard Components Depend on Data Stores

```
useDashboardMetrics()
  ├─ transactions ────► getCurrentBalance(accounts, transactions)
  │                    ├─ getAvailableBalance(accounts, transactions)  [NOT rendered]
  │                    ├─ getTotalIncome(transactions)
  │                    ├─ getTotalExpenses(transactions)
  │                    ├─ getNetCashFlow(transactions)                 [NOT rendered]
  │                    ├─ getMonthlySummary(transactions)  → income, expenses, savings
  │                    ├─ getMonthlyChart(transactions)    → monthlyChart
  │                    ├─ getCategoryBreakdown(transactions) → categoryData
  │                    ├─ getCashFlow(monthlyChart)         → cashFlow
  │                    └─ recentTransactions
  │
  ├─ accounts ─────────► getCurrentBalance, getAvailableBalance, getAccountsHealth
  │
  └─ goals ────────────► calculateGoalsTotal(goals, transactions) → totalSaved, totalTarget
                        ├─ getMonthlyGoalSavings(goals, transactions) → monthlySavings
                        └─ calculateGoalMetrics(goal, transactions) → goal metrics

useBudgetsPage()
  └─ budgets ─────────► calculateBudgetMetrics(budget, transactions) → budgetWithProgress
  └─ transactions ─────► (same transaction list)
  └─ budgetHistory ────► (for budget archive)

StatCard sparklines
  └─ monthlyChart ─────► incomes array
  └─ monthlyChart ─────► balanceSeries (cumulative)

Recurring Transactions
  └─ NOT referenced on Dashboard

Debt Management
  └─ NOT referenced on Dashboard

Notifications
  └─ NOT referenced by Dashboard itself (consumed in AppLayout)

Reports / Analytics
  └─ NOT referenced by Dashboard
  └─ Dashboard has "View Reports" link to /reports

Settings
  └─ useSettingsStore ─► localization (currency, date format)
  └─ Dashboard uses formatNaira() which reads currency from settings

Firebase
  └─ NOT directly in Dashboard
  └─ useAuthContext() provides user profile (display name, email)
  └─ Data persistence is handled outside Dashboard
```

### Coupling Summary

| Component | Tightly Coupled To | Loosely Coupled |
|---|---|---|
| Dashboard page | `useDashboardMetrics()`, `useBudgetsPage()`, `useFinanceStore`, `useAuthContext` | Individual chart components (could be extracted) |
| StatCard | `formatNaira`, lucide icons, variant map | Could accept different data shapes |
| GoalCard | `GoalMetrics` type, `formatNaira`, `formatDate`, `getGoalStatus` | Reusable across pages |
| BudgetCard | `BudgetMetrics` type, `budget-matching` service | Reusable across pages |
| CollapsibleSection | `sessionStorage` for persistence | Generic, reusable |
| EmptyState | lucide icons, `Button` component | Generic, reusable |
| Chart components | Recharts library, `formatNaira` | Generic, could be reused |

---

## 12. Redesign Constraints

### Tightly Coupled Components
These components share internal logic that must be preserved or carefully refactored:

- **BudgetCard + BudgetHealth inline rendering** — Budget Health section inlines the same budget logic as BudgetCard but with different visual treatment. Any redesign of budget display must keep both treatments consistent.
- **StatCard + variant system** — The 5 StatCard variants (balance, income, expense, savings, goals) each map to specific gradient backgrounds, sparkline colors, and icon combinations. The variant system is hardcoded.
- **CollapsibleSection + sessionStorage** — Persistence is tied to `sessionStorage` (not `localStorage`), meaning collapse state resets per browser tab session. Any redesign that changes section order must account for storage keys.
- **PageHeader + action buttons** — The two action buttons (View Reports, New Transaction) are children of PageHeader. They cannot be independently repositioned without modifying PageHeader.

### Reusable Components
These components are already modular and can be reused in a redesign:

- **StatCard** — Accepts `label`, `value`, `delta`, `icon`, `variant`, `data` props. Fully self-contained.
- **GoalCard** — Accepts `goal` + callback props. Used on Dashboard and Goals page.
- **BudgetCard** — Accepts `budget`, `metrics`, callback props. Used on Dashboard and Budgets page.
- **EmptyState** — Generic empty state with icon, title, description, action CTA.
- **CollapsibleSection** — Generic accordion with persistence.
- **ChartCard** — Wrapper component with title, subtitle, loading, empty, action slot.
- **ChartTooltip** — Shared tooltip styling for all Recharts charts.

### Independent Sections
These sections do not share business logic and could be independently redesigned:

- **Stat card row** — Standalone section. Can be re-laid-out, recolored, or replaced entirely.
- **Chart rows** — Standalone. Individual charts can be moved, resized, or restyled.
- **Savings Goals section** — Self-contained collapsible. Chart + GoalCards.
- **Current Budgets section** — Self-contained collapsible. BudgetCard grid.
- **Recent Transactions section** — Self-contained collapsible. Table + search/filter/sort/pagination.

### Layouts That Can Be Redesigned Without Affecting Business Logic
- **Stat card grid** — The 5-column layout at xl and 1/2-column at smaller sizes can be restructured without data changes.
- **Chart positioning** — Charts can be rearranged, merged into tabs, or shown conditionally.
- **Collapsible section order** — Sections can be reordered; storage keys would need updating.
- **Card visual treatment** — All card styling (`rounded-xl border bg-card p-5 shadow-elegant`) can be changed without touching business logic.
- **Transaction table** — The table rendering, column visibility, row design, and pagination UX can be redesigned. The filter/sort/paginate logic in `utils.ts` is decoupled.

### Components That Should Remain Independent
- **Sidebar** — Shared across all pages, not dashboard-specific.
- **AppLayout header** — Shared layout element. Non-dashboard features (search, notifications, theme) live here.
- **PageHeader** — Used across multiple pages (transactions, budgets, goals, etc.).
- **StatCard** — Used only on Dashboard currently, but is generic enough for reuse.
- **GoalCard / BudgetCard** — Used across Dashboard and dedicated pages.

---

*End of analysis. No suggestions or recommendations included — purely documentation of the current implementation.*
