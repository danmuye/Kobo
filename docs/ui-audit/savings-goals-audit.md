# Savings Goals Module UI/UX Audit

**Target:** `/goals` — `src/pages/SavingsGoals.tsx`
**Components:** `GoalCard` (274 lines), `GoalContributionDialog` (184 lines), `GoalTransactionsDrawer` (166 lines), `GoalAnalyticsDialog` (126 lines)
**Services:** `goal-matching.ts` (395 lines), `goal-insights.ts` (188 lines) — metrics, analytics, history, trends, forecasts
**Date:** 2026-07-20

---

## Executive Summary

The Savings Goals module is the most feature-complete page in Kobo. The service layer provides rich metrics (health score, consistency, contribution frequency, forecasts, heatmaps), the card displays 12 data points per goal, and the completion experience (auto-archive, sparkle animation, history tab) is well-considered. The contribution dialog has an inline balance check, and the transaction drawer shows goal-linked activity in context.

However, the module shares two problems with Budgets: **(1) the `color` field is set via ColorPicker but never rendered** — the progress bar uses the status-tone color, not the goal's custom color; **(2) the icon selector is a text dropdown** showing name strings rather than visual previews. Additionally: the `GoalAnalyticsDialog` uses Tailwind classes constructed via template literals (`border-${accent}-500/30`) which **will not compile** under Tailwind's JIT engine; there are no milestone markers on the progress bar; and the contribution dialog uses raw `useState` state management instead of the `react-hook-form` pattern used everywhere else.

**Verdict:** The richest analytical page in the app, with a well-integrated contribution workflow and thoughtful completion UX, undermined by a non-functional Tailwind pattern, a dead color field, and a limited 5-icon palette.

---

## UI Review

### Goal Cards
- Icon in status-colored box, name (truncated), status badge (5 tiers), kebab dropdown
- Health indicator: heart icon with dynamic fill opacity based on `healthScore` — well-executed
- Progress bar: animated fill, shimmer, overflow indicator (exceeded goals)
- Saved/Remaining metrics in bordered boxes (Saved box has subtle pulse animation on value change)
- Full-width "Add Contribution" button — primary CTA, correctly prominent
- Stats grid: 8 data rows — Days left, Required daily, Avg daily, Est. completion, Completed date (conditional), Transactions, Monthly avg — very dense
- Celebration sparkles (`Sparkles + animate-pulse`) for completed goals — delightful touch
- `AnimatePresence` for sparkle mount/unmount — correct
- **12 data points** in a single card is information-dense; the stats section at 235-270 scrolls past before the user can process it
- **Kebab menu contains 5 items** with a separator — reasonable, but "Add Contribution" is duplicated (exists as a prominent button + first dropdown item)

### Progress Bars
- Animated width fill (0.9s easeOut) — consistent with BudgetCard
- Color comes from status tone, **not from `goal.color`** — same dead-color issue as Budgets
- Shimmer overlay with 2s animation loop
- Exceeded overflow indicator with delayed animation (0.6s)
- `aria-valuenow/min/max` and `aria-label` set — good
- **No milestone markers** — 25/50/75/90% milestones are tracked in the notification engine but have no visual representation on the bar

### Contribution Workflow
- Dialog opens from "Add Contribution" button on card or dropdown
- Fields: Amount, From Account (with balance display), Wallet (optional), Date, Notes (optional), Tags (optional, CSV)
- Balance validation: shows error inline when amount exceeds available balance; disables submit
- Creates an expense-type transaction linked via `goalId`
- **Uses raw `useState` for all fields** (lines 25-31) — inconsistent with the rest of the app's `react-hook-form` pattern
- **No field-level validation errors displayed** — just a disabled submit button and a conditional balance error string
- **Tags field is a plain text input** — CSV pattern, same weakness as transactions and budgets

### Goal Creation/Editing
- Dialog form with: name, target/start date, target amount, funding type (4 options), categories/accounts/wallets/tags (CSV), icon (text dropdown), priority, color (ColorPicker), autoTrack/includeTransfers checkboxes, notes
- Uses `react-hook-form` + `zodResolver` with `goalSchema`
- **Icon selector is a text dropdown** showing 5 name strings: `shield`, `plane`, `laptop`, `home`, `target` — no visual preview, limited selection
- **ColorPicker sets `goal.color` which is never rendered** — stored, persisted, but the progress bar and card use status-tone colors
- **No "Recent" convenience** — unlike the transaction form, no recently-used categories or values are surfaced

### Goal Details (Transactions Drawer)
- Slide-out drawer (`Drawer` component from shadcn) with `ScrollArea`
- Goal summary section: 9 metrics across 9 boxes in a 3-column grid
- Transaction list below with individual `TransactionRow` cards
- Clean separation between summary and transactions
- Empty state for no-matching-transactions with helpful description
- Drawer is mobile-appropriate — slides up from bottom

### Completion Experience
- Auto-archived via `useEffect` in `SavingsGoals.tsx:132-142` — polls `metrics.isCompleted` and saves to `goalHistory`
- Completed tab shows goals with purple borders, purple top accent bar, sparkle animation
- History tab shows archived entries: name, completion date, days to complete, percentage badge, stats grid (target, saved, monthly avg, transactions)
- **Auto-archiving is silent** — no toast or celebration when a goal completes (the notification engine does emit `goal:completed`, but there's no in-page celebration)

### Milestones
- Notification engine monitors 25/50/75/90% milestones and emits `goal:milestone` events
- **No visible milestone markers on the progress bar** — no dots, flags, or labels at threshold points
- The only completion signal is the status badge changing and the sparkle icon appearing at 100%

### Animations
- Card entrance: `opacity: 0, y: 12` → `opacity: 1, y: 0` — standard, effective
- Card hover: `whileHover={{ y: -4 }}` — subtle lift
- Progress bar: 0.9s easeOut width fill, 0.6s delayed overflow
- Saved value box: pulse scale animation on value change (`scale: [1, 1.02, 1]`)
- Sparkle: scale-in + `animate-pulse` for completed goals
- No excessive animation — appropriate restraint

### Empty States
| Tab | Icon | Color | Message | CTA |
|---|---|---|---|---|
| Active | `Target` | Primary | "No active goals" + description | "Create Goal" |
| Completed | `Sparkles` | Purple-500 | "No completed goals yet" | None |
| History | `Archive` | Muted | "No history yet" | None |

- Well-differentiated with distinct icons, colors, and messages
- **Active tab empty state is inlined** (lines 170-179) rather than using the shared `EmptyState` component — minor inconsistency
- Completed and History tabs also inline their empty states

---

## UX Review

### Overall Workflow
1. User arrives → sees Active tab with card grid or empty state
2. Creates goal → form dialog → validates → saves → card appears
3. Views goal details → "View Transactions" from kebab → drawer slides up with summary + transactions
4. Adds contribution → "Add Contribution" button → dialog → selects account, enters amount → creates transaction → metrics update
5. Views analytics → "View Analytics" from kebab → dialog with stat cards
6. Edits goal → kebab → Edit Goal → form dialog with pre-filled values
7. Deletes goal → kebab → Delete Goal → AlertDialog → confirms → removed
8. Goal completes → auto-archived → card appears in Completed tab → history entry created

### Workflow Gaps
1. **No in-page celebration on goal completion** — auto-archive is silent; no confetti, no "🎉 Goal completed!" banner or toast (the notification engine sends a notification, but the page itself doesn't react)
2. **No way to manually archive a goal** — archiving is automatic only; users can't archive a goal that still has a small remaining balance
3. **No way to pause a goal** — no "snooze" or pause state; an active goal is always counting days
4. **No goal reordering** — goals are displayed in creation order (array order); no drag-to-reorder or pinning
5. **No goal grouping** — no way to group goals by priority, category, or timeline
6. **No visual timeline** — no Gantt-like view showing goal periods overlapping

### Contribution Flow
- Quick: 2 required fields (amount, account) with balance check — 3 clicks from card
- Balance validation prevents overspending — good
- Creates an expense transaction — consistent with the financial model
- **No confirmation step** — the transaction is created immediately on submit, which is correct for a modal but means no undo
- **No way to contribute from an income transaction** — goal allocation for income is only available in the main TransactionFormDialog, not from the goal itself

### Information Architecture
- 3-tab layout (Active / Completed / History) — clear and well-organized
- Goal card at 274 lines is the largest component in the module — 12 data points, health indicator, progress bar, dropdown, sparkles, stats grid
- `GoalAnalyticsDialog` and `GoalTransactionsDrawer` share substantial overlap in metrics shown (both show target/saved/remaining/days left/est. completion)

---

## Accessibility Review

### Passes
- `role="progressbar"` with `aria-valuenow/min/max` and `aria-label` on progress bars
- `aria-label` on kebab dropdown trigger
- Status badges with text labels (not color-only) — "On Track", "Near Target", "Completed", etc.
- Focus-visible rings on all interactive elements
- Radix-based `Dialog`, `AlertDialog`, `Drawer`, `DropdownMenu` — proper ARIA, focus trapping, keyboard interaction

### Fails / Gaps
1. **Dynamic Tailwind classes not JIT-safe** — `GoalAnalyticsDialog.tsx` uses `border-${accent}-500/30` and `bg-${accent}-500/5` template literals (lines 32, 38) which Tailwind's JIT compiler cannot statically analyze. These classes **will not compile** in production builds.
2. **No `tabular-nums`** — goal amounts in cards, drawer summary, and analytics dialog use proportional figures
3. **No `prefers-reduced-motion`** — progress bar animations, card entrance, saved-value pulse, and sparkle animation all fire regardless of user motion preference
4. **Small kebab touch target** — 32x32px icon button below the 44x44px WCAG recommendation on mobile
5. **No `aria-live` region on the card grid** — when a goal is added/deleted or contributions change, screen readers don't announce the updated metrics
6. **Contribution dialog has no field validation announcements** — errors are conveyed only through button disable state and an inline text message

---

## Mobile Review

| Element | Behavior at 375px |
|---|---|
| Card grid | 1 column |
| Tab bar | Full-width 3-column grid |
| Contribution dialog | Full-width, single column |
| Transactions drawer | Slides up, `max-h-[85vh]`, scrollable |
| Goal form | Responsive 2-column fields collapse to 1-column |

- Tab bar uses `grid grid-cols-3` on mobile — readable labels with count badges
- Pagination: none needed (goals are typically few)
- Drawer is mobile-appropriate: bottom-sheet behavior
- Contribution dialog at `max-w-md` fits well on mobile

---

## Component Inventory

| Component | File | Lines | Notes |
|---|---|---|---|
| SavingsGoals (page) | `src/pages/SavingsGoals.tsx` | 377 | Tabs, form dialog, delete, drawer, analytics, contribution |
| GoalCard | `src/components/savings/GoalCard.tsx` | 274 | Full card with health, progress, 12 metrics, sparkles |
| GoalContributionDialog | `src/components/savings/GoalContributionDialog.tsx` | 184 | Raw useState form, balance check |
| GoalTransactionsDrawer | `src/components/savings/GoalTransactionsDrawer.tsx` | 166 | Slide-out drawer with summary + tx list |
| GoalAnalyticsDialog | `src/components/savings/GoalAnalyticsDialog.tsx` | 126 | Stat cards, **broken Tailwind JIT classes** |
| useGoalsPage | `src/features/goals/hooks.ts` | 93 | Metrics with cache, CRUD |
| goal-matching | `src/services/goal-matching.ts` | 395 | Metrics, status, forecasts, matching |
| goal-insights | `src/services/goal-insights.ts` | 188 | Analytics, history, trends, heatmaps |

---

## Pain Points

1. **Non-functional Tailwind classes in GoalAnalyticsDialog** — Template-literal class names like `border-${accent}-500/30` cannot be compiled by Tailwind's JIT engine. These will silently produce no styling in production.
2. **`goal.color` stored but not rendered** — The ColorPicker sets a color that is persisted to the store and backend, but GoalCard's `ProgressBar` uses `toneColors[tone]` from status-based tones, not `goal.color`. Same dead-UI problem as Budgets.
3. **Icon selector is a text dropdown with only 5 options** — `shield`, `plane`, `laptop`, `home`, `target` as name strings; no visual preview; half the selection of Budgets (10).
4. **No milestone markers on progress bar** — 25/50/75/90% milestones are tracked by the notification engine but invisible on the bar itself.
5. **Contribution dialog uses raw `useState`** — inconsistent with the `react-hook-form` + Zod pattern used by the main goal form and every other form in the app.
6. **GoalCard at 274 lines with 12 data metrics** — the stats section is very dense; users may not absorb all 8 rows of information.
7. **Active tab empty state is inlined** — the three empty states (active/completed/history) are all inlined in `SavingsGoals.tsx` instead of using the shared `EmptyState` component.
8. **No completion celebration** — auto-archive is silent; no confetti, banner, or toast within the page.
9. **`GoalAnalyticsDialog` and `GoalTransactionsDrawer` overlap** — both show target, saved, remaining, days left, est. completion; the drawer shows more, making the analytics dialog feel redundant.
10. **`getGoalStatus` threshold quirk** — `pct >= 80` returns `"behind"` tone with `"Near Target"` label, which is contradictory (near target but flagged as behind).

---

## Quick Wins

1. **Fix GoalAnalyticsDialog Tailwind classes** — Replace `border-${accent}-500/30` with a mapping object that returns static class strings, e.g., `border-purple-500/30`, `border-success/30`, etc.
2. **Render `goal.color` in GoalCard** — Use it as the progress bar fill color (override `toneColors`), icon box background tint, or a left-edge accent bar — same fix as Budgets.
3. **Add milestone dots to progress bar** — Render small dots or flags at 25%, 50%, 75%, 90% positions on the bar track using `left: ${pct}%` positioning.
4. **Add `tabular-nums` to goal cards and stat displays** — One CSS rule for all amount containers.
5. **Add `prefers-reduced-motion` guard** — Skip progress bar animation, pulse, and sparkle animation when the user prefers reduced motion.
6. **Replace raw `useState` in contribution dialog with `react-hook-form`** — For consistency with the rest of the app and to get field-level validation.
7. **Use shared `EmptyState` component for empty tabs** — Replace the 3 inlined empty states (lines 170-179, 199-207, 227-235) with the app's `EmptyState`.

---

## Design Recommendations

1. **Give `goal.color` a visible purpose** — The most impactful use: color the progress bar fill to the goal's custom color, overriding the status-tone system. The tone can still drive the border/badge, but the bar itself should reflect the user's chosen color.

2. **Expand the icon palette to match Budgets** — 5 icons is too few. Add the same 10 icons Budgets uses or share the `iconMap`. Show visual icon previews in the form picker, not text names.

3. **Add progress bar milestone markers** — Small dots or vertical ticks at 25/50/75/90% on the bar track. The notification engine already fires `goal:milestone` at these thresholds; make them visible on the bar itself.

4. **Add an on-completion celebration** — A one-time "Goal completed!" banner above the card or a confetti burst triggered by the `goal:completed` event. The auto-archive is good infrastructure; make the user feel the achievement.

5. **Reduce GoalCard density** — Consider collapsing the detailed stats (days left, required daily, avg daily, est. completion, transactions, monthly avg) behind a "Show details" toggle, keeping the card focused on saved/remaining/progress/health.

6. **Resolve GoalAnalyticsDialog vs GoalTransactionsDrawer overlap** — Either make the Analytics dialog distinct (trend charts, heatmaps, velocity) or remove it and push all metrics into the drawer. Right now both show the same core numbers.

7. **Fix `getGoalStatus` threshold naming** — A goal at 80% should show "Near Target" with an amber tone or "On Track" with a green tone, not "Near Target" with a "behind" value. The tone and label should align.

---

## Hallmark Anti-Patterns

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Critical** | Non-functional Tailwind JIT classes | `GoalAnalyticsDialog.tsx:32,38` | `border-${accent}-500/30` and `bg-${accent}-500/5` cannot be compiled by Tailwind's JIT — classes silently produce no styling | Replace with a static class map |
| **Major** | Dead UI — `goal.color` stored, never rendered | `GoalCard.tsx:52-74`, `GoalCard.tsx:102` | ColorPicker sets `goal.color`, persisted to store/backend, but ProgressBar uses `toneColors[tone]` not `goal.color` | Map `goal.color` to progress bar fill or icon box tint |
| **Major** | Icon system — text names only, 5 options | `SavingsGoals.tsx:37`, form dropdown | Icon picker shows `"shield"`, `"plane"`, `"laptop"`, `"home"`, `"target"` as text strings; no visual preview; half the budget count | Show Lucide icon previews; expand to 10 icons |
| **Major** | Inconsistent form pattern | `GoalContributionDialog.tsx:25-31` | Uses raw `useState` instead of `react-hook-form` + Zod like every other form in the app | Refactor to RHF |
| **Minor** | Threshold/label mismatch | `goal-matching.ts:49` | `pct >= 80` returns tone `"amber"` with value `"behind"` but label `"Near Target"` — contradictory | Separate near-target from behind: `pct >= 80` → near-target (amber, "near-target"), or keep behind for 60-79% |
| **Minor** | Overlapping component scope | `GoalTransactionsDrawer.tsx:21-73` vs `GoalAnalyticsDialog.tsx:77-100` | Both show target, saved, remaining, days left, est. completion — same metrics, different surfaces | Differentiate or consolidate |
| **Minor** | Inlined empty states | `SavingsGoals.tsx:170-179, 199-207, 227-235` | Three empty state blocks inlined instead of using shared `EmptyState` component | Use `<EmptyState>` with appropriate props |
| **Minor** | No `tabular-nums` | All goal amount displays | Proportional figures in number columns don't align | Add `font-variant-numeric: tabular-nums` |
| **Minor** | No `prefers-reduced-motion` | GoalCard, ProgressBar, sparkle | Animations fire regardless of user motion preference | Add reduced-motion check |

---

## Overall Module Score

**7.2 / 10**

The Savings Goals module is the strongest page in Kobo — the richest metrics, the best-integrated workflow, the most thoughtful completion UX. The contribution dialog's balance check, the health indicator with dynamic fill, the completed-goal sparkles, and the auto-archive flow all show careful design.

The critical issue is the Tailwind JIT-breaking template literals in `GoalAnalyticsDialog`, which will silently fail in production. The dead `goal.color` field and limited 5-icon palette are the same craft debts seen in Budgets. Fix those two issues and the icon picker, and this page is the clear exemplar for the rest of the app.
