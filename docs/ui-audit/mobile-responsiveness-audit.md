# Mobile Responsiveness Audit

**Target:** Full application — 9 pages, 15+ components, 4 dialogs, 2 drawers
**Framework:** React 18 + Tailwind CSS + Framer Motion + Recharts
**Breakpoints tested:** 320px (small phone), 375px (large phone), 414px (large phone+), 768px (tablet portrait), 1024px (tablet landscape), 1280px+ (desktop)
**Date:** 2026-07-20

---

## Executive Summary

The application uses Tailwind's responsive utility classes consistently. Most pages use `grid-cols-1` as the base mobile layout with progressive enhancement via `sm:`, `md:`, `lg:`, and `xl:` breakpoints. The auth pages are fully mobile-optimized. The sidebar correctly uses off-canvas positioning below `lg` with a backdrop overlay. Tables use `overflow-x-auto` with responsive column hiding. Dialog components use sensible max-widths.

Five systemic issues recur across the application: **(1) undersized touch targets** — several interactive elements use `h-7`/`h-8`/`p-1` sizing that falls well below the 44×44px minimum recommendation; **(2) table column loss at narrow widths** — tables hide date and category columns on mobile, removing context users need for financial data; **(3) notification drawer actions are inaccessible on touch** — mark-read and delete buttons rely on hover to appear; **(4) dialog sizing on small phones** — `max-w-xl` and `max-w-4xl` dialogs can overflow or require excessive zooming at 320px; **(5) no mobile-specific chart treatment** — charts render at the same height and density on all viewports.

---

## Page-by-Page Analysis

### Auth Pages (Login, Register, ForgotPassword, VerifyEmail)

| Aspect | Assessment |
|---|---|
| Layout | Centered `max-w-sm` card, full-width form elements — optimal |
| Spacing | `p-4` body, `p-6` form padding — generous at 320px |
| Touch targets | `h-12 w-12` logo circle, full-width buttons — adequate |
| Overflow | None — card fits within viewport |
| Landscape | Centered card on wide viewport — fine, but vertical space is wasted with the same layout |
| Issues | No landscape-specific optimizations (e.g., horizontal form layout on wide-but-short viewports) |

---

### Dashboard

| Aspect | Assessment |
|---|---|
| Layout | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-5` stat cards |
| Spacing | `p-5` cards, `px-5 py-3` table cells — adequate |
| Touch targets | `h-9 w-9` filter/action buttons, `h-9` inputs — below 44×44px |
| Charts | Stack 1-column on mobile via `lg:grid-cols-2` — correct, but chart heights are fixed at `h-64` |
| Tables | `overflow-x-auto` with `hidden sm:table-cell` (Date) and `hidden md:table-cell` (Account) — at 320px only Description and Amount remain, removing date context for recent transactions |
| Issues | Stat cards jump from 2-col to 5-col at `xl` — 5th card wraps alone on intermediate widths; 5 charts on mobile is excessive without progressive disclosure |

---

### Transactions

| Aspect | Assessment |
|---|---|
| Layout | Full-width table, search + filter bar in `flex flex-col gap-2 sm:flex-row` |
| Spacing | `px-5 py-3` table cells — good |
| Touch targets | `h-9 w-9` action buttons, `h-10` search input — borderlines |
| Tables | `overflow-x-auto`, `hidden md:table-cell` (Account), `hidden sm:table-cell` (Date) — at 320px only Description, Category, Amount visible but all needed columns |
| Filter bar | `flex flex-col sm:flex-row` — wraps correctly on mobile |
| Issues | No visible date column on small phones means users cannot tell when a transaction occurred without tapping into it |

---

### Budgets

| Aspect | Assessment |
|---|---|
| Layout | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` for budget detail cards in overview |
| Spacing | `p-4` section headers, `p-3` form rows |
| Touch targets | Budget card action area buttons — adequate |
| Tables | No responsive column hiding on the budget comparison or history tables (budget-table uses inline styles for column widths) |
| Forms | `grid-cols-2 gap-3` form rows collapse to 1-column on mobile via `grid-cols-1` base — correct |
| Issues | Budget table at 320px can scroll horizontally but columns don't hide responsively |

---

### Savings Goals

| Aspect | Assessment |
|---|---|
| Layout | `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` goal cards |
| Spacing | `gap-3` in grid |
| Touch targets | `h-16 w-16` empty state icon — good; goal card buttons — adequate |
| Tables | Goals use cards, not tables — no overflow issue |
| Dialogs | `max-w-xl` for CRUD dialog — at 320px this is effectively `calc(100vw - 2rem)` via dialog default styling, acceptable but snug |
| Issues | Goal card density (12 data points) compresses severely at 320px; 3-column metric grids become very narrow |

---

### Debts

| Aspect | Assessment |
|---|---|
| Layout | `grid-cols-1 sm:grid-cols-3` summary cards, `grid-cols-1 lg:grid-cols-2` debt cards |
| Spacing | `p-5` summary and debt cards |
| Touch targets | `h-7 w-7` color swatches — 28×28px, well below 44×44px minimum; `h-8 w-8` kebab trigger — 32×32px, undersized |
| Dialogs | `max-w-xl` for CRUD — acceptable; `max-w-md` for payment dialog — good |
| Drawers | `w-full sm:max-w-2xl` for payments drawer — full-width on mobile, correct |
| Tables | Payments drawer table: `hidden sm:table-cell` (Category, Date), `hidden md:table-cell` (Account), `hidden xl:table-cell` (Merchant) — at 320px only Description and Amount are visible |
| Issues | Color picker uses `h-7 w-7` buttons in a `flex flex-wrap` row — touch targets are too small and too close together; DebtCard 3-column metric grid (`grid-cols-3`) at 320px produces very narrow cells |

---

### Reports & Analytics

| Aspect | Assessment |
|---|---|
| Layout | `grid-cols-2 lg:grid-cols-4` KPI cards, `grid-cols-1 lg:grid-cols-2` charts |
| Spacing | Filter bar uses `flex flex-wrap` — wraps to 3+ rows at 320px |
| Touch targets | `h-7` filter selects and buttons — 28px high, undersized; `p-1.5` export icon buttons — effectively ~22×22px, well below minimum |
| Charts | 8 charts at `h-64` each — at 320px this is 512px of chart content per row (1-col) plus scroll |
| Filter bar | Date range buttons (5 presets) + custom date inputs + 3 category selects + compare toggle + export icons + clear button — at 320px this wraps to 4-5 rows, taking ~200px of vertical space before any content |
| Issues | `max-w-[140px]` date inputs — narrow but functional; `h-7` select triggers and buttons throughout the filter bar are undersized for touch |

---

### Accounts

| Aspect | Assessment |
|---|---|
| Layout | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` summary stats, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` account cards |
| Spacing | `p-4` summary cards, `p-5` account cards |
| Touch targets | `h-7 w-7` color swatches — same as Debts, 28×28px undersized |
| Forms | Account form dialog uses responsive grid — collapses correctly |
| Issues | Same color-picker touch-target issue as Debts |

---

### Settings

| Aspect | Assessment |
|---|---|
| Layout | `md:grid-cols-2` sections — collapses to 1-column on mobile |
| Spacing | `p-5` section cards, `p-4` sub-forms |
| Touch targets | Standard button sizing — adequate |
| Forms | Theme radio cards flex naturally at all widths; localization selects collapse via `sm:grid-cols-2 lg:grid-cols-4` |
| Issues | None significant — Settings is the most mobile-friendly page |

---

### Notification Drawer

| Aspect | Assessment |
|---|---|
| Layout | `w-[calc(100vw-2rem)] sm:w-96` — full-width minus margins on mobile |
| Spacing | `px-4 py-3` items |
| Touch targets | `p-1` action buttons (mark read, delete) — 4px padding around ~14px icons = ~22×22px; `h-8` filter select and search input — 32px high; all below 44×44px |
| Actions | Hover-reveal pattern (`opacity-0 group-hover:opacity-100`) — inaccessible on touch devices; buttons are present in DOM but invisible unless the row is focused |
| Scroll | `max-h-[60vh]` — at 320px with browser chrome, ~180px of list content, roughly 4 items visible |
| Issues | Smallest touch targets in the app; hover-reveal pattern fails on touch; no swipe-to-dismiss |

---

## Systemic Issues

### 1. Touch Targets Below 44×44px Minimum

| Element | Size | Pages | WCAG Violation |
|---|---|---|---|
| Color swatches | `h-7 w-7` (28×28px) | Debts, Accounts, Goals | Yes — WCAG 2.5.5 |
| Kebab/action buttons | `h-8 w-8` (32×32px) | DebtCard, BudgetCard, Dashboard, Transactions | Yes — WCAG 2.5.5 |
| Notification actions | `p-1` (~22×22px) | NotificationItem | Yes — WCAG 2.5.5 |
| Export buttons | `p-1.5` (~26×26px) | Reports | Yes — WCAG 2.5.5 |
| Sort/filter toggles | `h-8 w-8` (32×32px) | NotificationDrawer, Reports | Yes — WCAG 2.5.5 |
| Filter selects | `h-7` (28px high) | Reports | Yes — WCAG 2.5.5 |

**Impact:** Users with larger fingers or motor impairments will struggle with color swatches, notification actions, and export buttons. These elements are clustered in tight groups, increasing mis-tap probability.

**Fix:** Increase to minimum `h-10` (40×40px) or `p-2.5` for all interactive elements. Color swatches should use `h-10 w-10`. Increase gaps between grouped buttons to `gap-2` minimum.

---

### 2. Table Column Loss at Narrow Widths

| Page | Hidden Columns at 320px | What the user loses |
|---|---|---|
| Dashboard | Date, Account | Cannot tell when or from which account a transaction occurred |
| Transactions | Date, Account | Same — date context lost for every transaction |
| DebtPaymentsDrawer | Category, Account, Merchant, Date | Only Description and Amount remain |

**Impact:** Financial transactions without visible dates or accounts are nearly useless on mobile. Users must tap into each transaction to see context.

**Fix:** Prioritize columns differently — show Date and Amount always (compact date format), collapse Description to `truncate`. Or add a `text-[10px]` date below each description row rather than hiding it entirely.

---

### 3. Hover-Reveal Actions on Touch Devices

| Component | Hidden Actions | Impact |
|---|---|---|
| NotificationItem | Mark read, Delete | Invisible on touch until row is focused via tab navigation |
| DebtCard kebab | Edit, Delete, Payments, Analytics | Kebab icon itself is visible (no issue), but the dropdown behavior requires tap |
| BudgetCard insights toggle | Insights panel | Visible button — no issue |
| StatCard | None | No hidden actions |

**Impact:** The NotificationItem mark-read and delete buttons are invisible on touch devices. Users cannot discover that these actions exist without tapping and holding or tabbing to the row.

**Fix:** On touch devices (`pointer: coarse` media query), keep action buttons always visible at reduced opacity, or switch to a swipe gesture pattern. Alternatively, always show the mark-read button (it's small enough to be unobtrusive) and only hide the delete button.

---

### 4. Dialog Sizing on Small Phones

| Dialog | Max-Width | Behavior at 320px |
|---|---|---|
| Auth forms | `max-w-sm` | 320px — fits perfectly |
| DebtPaymentDialog | `max-w-md` | 320px — dialog default padding makes this snug but functional |
| Debts CRUD | `max-w-xl` | 320px — 2-column form rows collapse; may require zoom |
| SavingsGoals CRUD | `max-w-xl` | Same as Debts |
| DebtAnalyticsDialog | `max-w-4xl` | 320px — too wide; charts and 10 metric cards compress severely |
| Reports filter date inputs | `max-w-[140px]` | 140px at 320px — functional |

**Impact:** `max-w-4xl` dialogs (DebtAnalyticsDialog) on 320px viewports render charts at unusable widths and 10 metric cards in a grid that collapses awkwardly.

**Fix:** For analytics dialogs, use a mobile-specific layout: stack metric cards 2-column on mobile (instead of 4-column), reduce chart height, or make the dialog full-screen on mobile (`max-h-screen w-full`).

---

### 5. Chart Density on Mobile

| Page | Charts | Mobile behavior |
|---|---|---|
| Dashboard | 5 charts at `h-64` each | Stacks 1-col; 5 × 256px = 1280px of chart content |
| Reports | 8 charts at `h-64` each | Stacks 1-col; 8 × 256px = 2048px of chart content |
| DebtAnalyticsDialog | 4 charts | Fixed height, compressed at narrow widths |

**Impact:** High chart count combined with fixed height (256px) creates excessive scroll length on mobile. Charts are not simplified for small screens — same data density at 320px as at 1920px.

**Fix:** Reduce chart height on mobile (`h-48` or `h-40` at `<md` breakpoint). Consider collapsing less important charts behind a "Show more" toggle. Reduce tick frequency on X/Y axes at narrow widths.

---

### 6. Sidebar Navigation on Mobile

| Aspect | Current behavior |
|---|---|
| Trigger | Hamburger button (`lg:hidden`) in sticky header |
| Panel | Off-canvas `-translate-x-full lg:translate-x-0` with `w-64` |
| Overlay | Backdrop with `lg:hidden` |
| Active state | Animated indicator bar |

**Assessment:** The sidebar pattern is well-implemented. The hamburger icon uses `h-9 w-9` (slightly undersized at 36×36px). The off-canvas transition is smooth. The overlay correctly prevents background interaction.

**Issues:** No swipe-to-open gesture; the hamburger is the only entry point. 9 navigation items in a `w-64` sidebar at 320px may require scrolling (`overflow-y-auto` is present).

---

### 7. Landscape Mobile

| Page | Behavior |
|---|---|
| Auth | Centered card — adequate but wastes vertical space |
| Dashboard | 2-column grids expand to show more content — good |
| Tables | Landscape provides enough width to show most columns |
| Charts | Still stack 1-column at `<lg` — acceptable |
| Dialogs | Full-width dialogs benefit from landscape width |
| Sidebar | Remains off-canvas below `lg` — hamburger required |

**Assessment:** The app functions in landscape mode but no pages have landscape-specific optimizations. Auth pages in particular show a small centered card in a wide viewport.

---

## Prioritized Improvement List

### Critical (fix immediately)

| # | Issue | Location | Fix |
|---|---|---|---|
| C1 | Hover-reveal notification actions fail on touch | `NotificationItem.tsx:94-98` | Remove `opacity-0 group-hover:opacity-100` on touch devices; always show mark-read button; use swipe-to-dismiss for delete |
| C2 | Notification action buttons are 22×22px | `NotificationItem.tsx:103,111` | Increase `p-1.5` to `p-2.5` (minimum 44×44px) |
| C3 | Color swatch buttons are 28×28px | `Debts.tsx:306`, `Accounts.tsx:111`, `SavingsGoals.tsx` | Increase `h-7 w-7` to `h-10 w-10`; increase `gap-1.5` to `gap-2` |

### High Priority

| # | Issue | Location | Fix |
|---|---|---|---|
| H1 | Date column hidden on mobile transaction tables | `Dashboard.tsx:305-306`, `Transactions.tsx:140-141`, `DebtPaymentsDrawer.tsx:110,154` | Append compact date (`text-[10px]`) below each description rather than hiding the date column; or move date to always-visible with compact format (`MM/DD`) |
| H2 | Kebab/action buttons are 32×32px | `DebtCard.tsx:123`, `BudgetCard.tsx:84`, `Dashboard.tsx:281,285,291` | Increase `h-8 w-8` to `h-10 w-10` |
| H3 | Report filter bar wraps to 5 rows on small phones | `Reports.tsx:259,285` | Collapse filters behind a "Filters" button on mobile; show as a dropdown overlay rather than inline |
| H4 | `max-w-4xl` analytics dialog overflows at 320px | `DebtAnalyticsDialog.tsx:95` | Use `max-w-[calc(100vw-2rem)]` on mobile or detect viewport and switch to full-screen dialog |
| H5 | Export buttons are 26×26px | `Reports.tsx:346-358` | Increase `p-1.5` to `p-2` minimum; use `h-8 w-8` minimum |

### Medium Priority

| # | Issue | Location | Fix |
|---|---|---|---|
| M1 | Chart height fixed at 256px on mobile | `Dashboard.tsx`, `Reports.tsx`, `ChartCard.tsx:28` | Reduce to `h-40` or `h-48` on `<768px` viewports; use responsive class `h-48 md:h-64` |
| M2 | Dashboard stat cards jump 1→2→5 columns | `Dashboard.tsx:76` | Use `xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-5` to smooth the transition |
| M3 | No swipe-to-open sidebar gesture | `Sidebar.tsx` | Add `useSwipe` hook or `onTouchStart` handler for right-edge swipe to open sidebar |
| M4 | No swipe-to-dismiss notifications | `NotificationItem.tsx` | Integrate a swipe gesture library or implement touch event handlers for left-swipe to reveal delete |
| M5 | Reports date range picker `h-7` selects | `Reports.tsx:96,331,340` | Increase `h-7` to `h-9` on mobile for touch targets |
| M6 | DebtPaymentsDrawer only shows 2 of 6 columns at 320px | `DebtPaymentsDrawer.tsx:109-161` | Add a compact card below each row showing date and account context, or switch to a card-based layout on mobile |

### Low Priority

| # | Issue | Location | Fix |
|---|---|---|---|
| L1 | Auth pages waste vertical space in landscape | `Login.tsx`, `Register.tsx`, etc. | Consider horizontal form layout for landscape (`flex-row` on orientation media query) |
| L2 | `max-h-[60vh]` notification drawer shows only 4 items | `NotificationDrawer.tsx:153` | Consider `max-h-[70vh]` on mobile where screen chrome takes ~10% of height |
| L3 | No pull-to-refresh on data pages | All list pages | Add pull-to-refresh for transaction lists, budget cards, etc. |
| L4 | Budget table has no responsive column hiding | `Budgets.tsx` | Add `hidden sm/md/lg` classes to less important columns |
| L5 | DebtCard 3-column metric grid at 320px | `DebtCard.tsx:195` | Collapse to `grid-cols-2` on `sm` and below, moving least important metric to a second row |

---

## Component Touch Target Audit

| Component | Interactive Element | Current Size | Minimum Gap | Recommendation |
|---|---|---|---|---|
| ColorSwatch | Color button | `h-7 w-7` (28px) | `gap-1.5` (6px) | `h-10 w-10` + `gap-2` |
| DebtCard | Kebab trigger | `h-8 w-8` (32px) | Inline | `h-10 w-10` |
| BudgetCard | Kebab trigger | `h-8 w-8` (32px) | Inline | `h-10 w-10` |
| NotificationItem | Mark-read btn | `p-1.5` (~22px) | `gap-0.5` (2px) | `p-2.5` + `gap-1.5` |
| NotificationItem | Delete btn | `p-1.5` (~22px) | `gap-0.5` (2px) | `p-2.5` + `gap-1.5` |
| Reports exports | CSV/Excel/PDF btns | `p-1.5` (~22px) | `gap-0.5` (2px) | `p-2` minimum + `gap-1` |
| Report filter selects | `SelectTrigger` | `h-7` (28px) | Inline | `h-9` |
| Dashboard filter btns | Filter buttons | `h-9` (36px) | `gap-2` | Acceptable (closest to target) |
| AppLayout hamburger | Menu toggle | `h-9 w-9` (36px) | Isolated | Acceptable |
| AppLayout bell icon | Notif toggle | `h-9 w-9` (36px) | `gap-2` | Acceptable |
| Tabs (all pages) | Tab triggers | `h-9` or `py-1.5` | Inline | Acceptable at `py-2` minimum |

---

## Table Responsiveness Summary

| Page | Scroll | Columns at 320px | Columns hidden | Verdict |
|---|---|---|---|---|
| Dashboard | `overflow-x-auto` | Description, Category, Amount | Date (`sm`), Account (`md`) | Marginal — date loss is significant |
| Transactions | `overflow-x-auto` | Description, Category, Amount | Date (`sm`), Account (`md`) | Marginal — same issue |
| DebtPaymentsDrawer | `overflow-x-auto` | Description, Amount | Category (`sm`), Date (`sm`), Account (`md`), Merchant (`xl`) | Poor — 2 of 6 columns visible |
| Budgets | `overflow-x-auto` | All | None | No responsive hiding — best of the group |
| Reports (largest payments) | None | All rows | None | No table, uses list layout |
| Settings (none) | None | N/A | N/A | Settings uses cards, not tables |

---

## Dialog Responsiveness Summary

| Dialog | Max-Width | 320px | 375px | 768px | Verdict |
|---|---|---|---|---|---|
| Auth forms (Login etc.) | `max-w-sm` | ✓ | ✓ | ✓ | Excellent |
| Transaction form | `max-w-lg` | ✓ snug | ✓ | ✓ | Acceptable |
| Debt payment | `max-w-md` | ✓ | ✓ | ✓ | Good |
| Debts CRUD | `max-w-xl` | ✓ snug | ✓ snug | ✓ | Acceptable — form rows collapse well |
| Debt analytics | `max-w-4xl` | ✗ overflows | ✗ snug | ✓ | Poor — too wide for mobile |
| Budget details | `max-w-3xl` | ✓ snug | ✓ | ✓ | Acceptable |
| Goal details | `max-w-3xl` | ✓ snug | ✓ | ✓ | Acceptable |

---

## Overall Verdict

**Score: 5/10**

The app has good responsive bones — Tailwind's utility system is used consistently, grid layouts collapse correctly, the sidebar off-canvas pattern is standard, and auth pages are fully optimized. However, the mobile experience is held back by pervasive undersized touch targets and a "desktop page at mobile width" approach to tables and data density.

The three changes that would most improve the mobile experience:
1. **Bump all undersized touch targets to minimum 40×40px** (color swatches, kebab buttons, notification actions, export buttons, filter selects)
2. **Restore date context on mobile transaction tables** by appending compact dates to description rows rather than hiding the column
3. **Add touch-visible notification actions** by removing the hover-reveal pattern and always showing mark-read buttons

These three changes address the most frequent interaction points and would move the score to ~7/10.
