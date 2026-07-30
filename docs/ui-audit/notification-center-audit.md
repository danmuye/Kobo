# Notification Center UI/UX Audit

**Target:** Notification Drawer (`NotificationDrawer.tsx`, 190 lines), Notification Item (`NotificationItem.tsx`, 119 lines), Bell Icon (`AppLayout.tsx` lines 131–161)
**Engine:** `notification-engine/engine.ts` (111 lines) — singleton with dedup
**Types:** 37 event templates (`types.ts`, 335 lines) — budget, goal, debt, account, transaction, system
**Store:** `notifications.ts` (86 lines) — Zustand, `AppNotification[]` + `NotificationPreferences`
**Auto-hook:** `use-auto-notifications.ts` (249 lines) — threshold-based auto-detection of financial events
**Public API:** `notifications.ts` (94 lines) — `notify` (toast) + `emitFinancialEvent` (engine)
**Settings:** `Settings.tsx` lines 648–671 — 6 notification preference toggles (of 10 available keys)
**Date:** 2026-07-20

---

## Executive Summary

The Notification Center uses a dropdown drawer anchored to a bell icon in the app's sticky header. It lists notifications with type-based icons (success/error/warning/info), relative timestamps, category labels, and hover-reveal action buttons (mark read, delete). The underlying engine is sophisticated — 37 event types with template patterns, a dedup layer with time-window fingerprinting, and an auto-notification hook that monitors budgets, goals, debts, accounts, and transactions for threshold events and generates notifications automatically. A toast (`sonner`) fires alongside each notification.

Four issues prevent the notification center from being a polished experience: **(1) the read/unread distinction is too subtle** — read items use `opacity-60` with no background or border change, making it hard to scan which items are new; **(2) there is no grouping** — all notifications appear in a flat chronological list with no date separators (Today, Yesterday, This Week) or category grouping; **(3) notification items have no click action** — tapping a notification only reveals hover-action buttons; there is no navigation to the related entity (budget, goal, debt, transaction); **(4) the auto-notification hook can fire duplicate milestone notifications** — goal milestones and debt milestones emit on every render where the percentage threshold is met, with no tracking of previously-emitted milestones.

**Verdict:** A well-engineered notification system with a capable event engine and thorough auto-detection, undermined by a flat, low-contrast drawer UI that doesn't leverage the rich data (category, entityId, relatedId) already stored in each notification.

---

## UI Review

### Bell Icon (AppLayout.tsx)
- `Bell` Lucide icon in a `h-9 w-9` button in the sticky header
- Unread count badge: `h-4 min-w-[16px]` pill, `bg-destructive text-destructive-foreground`, `text-[9px]` font
- Overflow protection: `unreadCount > 99 ? "99+" : unreadCount`
- `aria-label` dynamically includes unread count: `"Notifications (3 unread)"`
- Positioned next to the theme toggle and "Add Transaction" button
- Click toggles drawer open/close
- Drawer lazy-loaded via `<Suspense fallback={null}>`

### Notification Drawer (NotificationDrawer.tsx)
- Dropdown panel anchored to the bell: `absolute right-0 top-full mt-2`, `w-[calc(100vw-2rem)] sm:w-96`
- Animated entrance/exit: Framer Motion `scale + opacity` (0.15s easeOut)
- `role="dialog"`, `aria-modal="true"`, `aria-label` includes unread count
- Header: "Notifications" title + unread pill badge + action buttons (Mark all read, Clear all)
- Search bar: `Search` icon + `Input` with `placeholder="Search..."`, `aria-label="Search notifications"`
- Type filter: `Select` dropdown with options All / Success / Error / Warning / Info
- Sort toggle: `ArrowUpDown` button, toggles between newest/oldest
- Notification list: `ul` with `divide-y divide-border`, each item is a `li` > `NotificationItem`
- Empty state (no filters): `Bell` icon + "No notifications yet" + helper text
- Empty state (with filters): "No notifications match your filters."
- Scrollable: `max-h-[60vh] overflow-y-auto overscroll-contain`
- `role="list"` on the scroll container, `aria-label` with filtered count
- `aria-live="polite"` and `aria-atomic="true"` on the list — announces changes
- State resets on close: search, filter, sort all return to defaults when drawer closes

### Notification Item (NotificationItem.tsx)
- Layout: icon (left) → content (center) → actions (right)
- Type-based icon: `CheckCircle` (success), `XCircle` (error), `AlertTriangle` (warning), `Info` (info), `Bell` (fallback)
- Type-based color: success-green, error-red, warning-amber, info-primary — applied to `h-7 w-7` rounded-full icon container
- Title: `text-sm font-medium leading-tight truncate`
- Message: `text-xs text-muted-foreground`, `line-clamp-1` in compact mode
- Relative time: `formatRelativeTime` — "just now", "5m ago", "3h ago", "2d ago", date for older
- Category label: `text-[10px] text-muted-foreground/50 capitalize`
- Unread indicator: `h-2 w-2` red dot, positioned next to title
- Read state: `opacity-60` on the entire row — the only visual distinction
- Action buttons: Mark read (`Check` icon, shown only when unread), Delete (`Trash2` icon)
- Hover-reveal actions: `opacity-0 group-hover:opacity-100` in compact mode — actions hidden until hover/focus
- `role="listitem"`, `group` class for hover state
- `aria-label` on mark read: `"Mark "{title}" as read"`
- `aria-label` on delete: `"Delete notification: {title}"`

---

## UX Review

### User Flows
1. **Receive notification** → auto-generated by engine → toast appears → bell badge updates
2. **View notifications** → click bell → drawer opens → scan list
3. **Filter notifications** → search by keyword or type filter → list narrows
4. **Sort notifications** → toggle newest/oldest → list reorders
5. **Mark single as read** → hover item → click checkmark → opacity changes
6. **Mark all as read** → click header button → all items fade to `opacity-60`
7. **Delete single** → hover item → click trash → item removed
8. **Clear all** → click header button → all items removed
9. **Manage preferences** → Settings → Notifications → toggle switches

### Read/Unread States
- **Problem:** The only visual distinction between read and unread is `opacity-60` on the entire read row. At a glance, all notifications look similar. Users must scan for the small red dot (unread) or notice the slight transparency difference (read).
- No background color change, no left border accent, no bold/unbold title distinction
- On dark mode, `opacity-60` can make text harder to read against the popover background
- No "mark as unread" action available — once read, always read

### Grouping
- **No grouping of any kind** — 37 event types across 9 categories all rendered in a flat `ul`
- No date separators: "Today", "Yesterday", "This Week", "Older"
- No category separators: Budget notifications, Goal notifications, Debt notifications, etc.
- With hundreds of accumulated notifications, the flat list becomes unscannable
- The category label is available in each item (`n.category`) but never used for grouping

### Actions
- **No click-through action** — tapping a notification row does nothing. The `actionUrl` and `relatedId` fields exist on `AppNotification` but are never consumed by the UI. A budget warning notification cannot navigate to that budget; a debt overdue notification cannot open that debt.
- Mark-read and delete are hidden behind hover (in the drawer) — on touch devices they are only accessible via focus (tab-navigation) or long-press context
- No bulk select mode — users can only mark-all-read or clear-all, with no intermediate option to select a subset

### Notification Preferences
- Settings exposes 6 toggles (`budgetAlerts`, `savingsAlerts`, `debtReminders`, `accountAlerts`, `largeTransactionAlerts`, `monthlySummaries`)
- 4 hidden preference keys (`budgetEndingAlerts`, `budgetEndedAlerts`, `budgetThresholdAlerts`, `goalMilestoneAlerts`) are checked in `use-auto-notifications` with `?? true` fallbacks — they default to ON with no user-facing toggle
- The auto-notification hook correctly checks preferences before emitting, but users cannot control granular budget alerts (ending soon, ended, threshold) or goal milestone alerts

### Auto-Notification Behavior
- `use-auto-notifications` runs on every render where `budgets`, `goals`, `debts`, `transactions`, or `accounts` change
- Budget warnings emit every render where percentage >= threshold (no tracking of previously-emitted threshold states for 80%/95% — only `prevBudgetPct` is tracked for the forward-crossing check)
- Goal milestone notifications emit on every render where `metrics.percentage >= m`, with no tracking of previously-emitted milestone IDs — the dedup layer prevents duplicates within the same hour, but if the hook runs in a new hour window, the same milestone re-emits
- Debt milestone check (line 184) gates on BOTH `debtReminders` AND `goalMilestoneAlerts` — likely a copy-paste bug

### Empty States
- Two distinct empty states: "No notifications yet" (pristine state) vs "No notifications match your filters" (filtered state) — good contextual messaging
- Helper text: "Notifications will appear here as you use the app." — informative for new users
- Centered layout with `Bell` icon — consistent with the app's empty-state pattern

---

## Accessibility Review

### Passes
- `role="dialog"` and `aria-modal="true"` on the drawer
- `aria-label` on drawer including unread count
- `role="list"` on notification container
- `role="listitem"` on each notification item
- `aria-label` on bell button with unread count
- `aria-label` on mark-read buttons with notification title
- `aria-label` on delete buttons with notification title
- `aria-label` on "Mark all as read" and "Clear all" action buttons
- `aria-label` on search input, sort toggle
- `aria-live="polite"` and `aria-atomic="true"` on the filtered list
- `aria-hidden` on decorative icons
- `focus-visible:ring-2` on all interactive elements
- Search has `ref={searchRef}` for potential focus management

### Fails / Gaps
1. **Hover-reveal action buttons** — Mark-read and delete buttons in the drawer use `opacity-0 group-hover:opacity-100`. While they are focusable via keyboard (the pattern includes `group-focus-within:opacity-100`), the affordance is visually hidden. On touch devices without hover, users must tap to focus the row first, then tap the action — a two-step process per item.
2. **No focus management on open** — When the drawer opens, focus is not moved to the search input or first notification. Keyboard users must tab from the bell button into the drawer.
3. **Read state contrast** — `opacity-60` can reduce contrast below WCAG AA thresholds, especially for the `text-muted-foreground` message text on the popover background.
4. **No announcement for mark-all-read or clear-all** — These actions modify the notification list but have no `aria-live` announcement of how many items were affected.
5. **Relative time format** — "5m ago", "3h ago" are not expanded for screen readers. An `aria-label` with the absolute date would be more accessible (e.g., `aria-label="3 hours ago — July 20, 2026 at 2:30 PM"`).
6. **No keyboard shortcut** — No shortcut (e.g., `Ctrl+N` or `Cmd+N`) to open the notification drawer.

---

## Mobile Review

### Breakpoints
| Width | Behavior |
|---|---|
| 320px | Drawer is `w-[calc(100vw-2rem)]` — effectively full-width minus 16px margins. Search + filter + sort fit in the toolbar row. Items touch edge to edge. |
| 375px | Same as 320 — comfortable width. `sm:w-96` doesn't activate until 640px. |
| 414px | Still full-width drawer. |
| 768px | Drawer becomes `w-96` (384px) — properly sized dropdown. |

### Issues
1. **Hover-reveal actions are inaccessible on touch** — The mark-read and delete buttons require hover or focus to appear. On mobile, users must tap the row to focus it, then tap the action button. There is no visual cue that the row is focusable or that hidden actions exist.
2. **Small tap targets** — Action buttons are `p-1.5` (approximately 22×22px) — below the recommended 44×44px minimum touch target. The sort toggle and type filter are `h-8` — adequate but snug.
3. **No swipe-to-dismiss** — Mobile users cannot swipe a notification to dismiss it; they must tap to reveal the delete button.
4. **Drawer height** — `max-h-[60vh]` means the drawer occupies 60% of the viewport height. On a 320px-tall mobile screen (with browser chrome), this leaves ~192px of scrollable list — roughly 4–5 items visible at a time.

---

## Design Recommendations

1. **Improve read/unread visual distinction** — Replace the subtle `opacity-60` with a combination of changes: bold title font for unread (`font-semibold`), normal weight for read (`font-medium`); left border accent for unread (`border-l-2 border-primary` or type-colored); subtle background tint for unread (`bg-accent/30`). This makes scanning the list for unread items immediate.

2. **Add date-based grouping** — Group notification list by date: "Today", "Yesterday", "This Week", "Older". Use a sticky date header between groups. This dramatically improves scanability for users with accumulated notifications.

3. **Add click-through navigation** — Make the notification row clickable. Use the `relatedId` and a category-to-route map (`budget` → `/budgets`, `goal` → `/goals`, `debt` → `/debts`, `transaction` → `/transactions`) to navigate to the relevant entity. This transforms the drawer from a passive log into an actionable hub.

4. **Fix hover-reveal for mobile** — Keep action buttons visible on touch devices by testing for hover capability, or always show the mark-read/delete buttons (they are small enough to be unobtrusive). Use `pointer: coarse` media query to detect touch devices.

5. **Add category grouping** — Group notifications by category within each date section (Budget, Goals, Debt, Account, System). Use a small category heading or an icon-based visual separator.

6. **Add "mark as unread"** — Allow users to toggle a notification back to unread state. Useful when a notification is seen but requires follow-up.

7. **Expose all 10 preference keys in Settings** — Add toggles for `budgetEndingAlerts`, `budgetEndedAlerts`, `budgetThresholdAlerts`, and `goalMilestoneAlerts` in the Settings notification section so users can control granular budget and milestone alerts.

8. **Fix auto-notification duplicate mitigation** — Track emitted milestone fingerprints in a `Set<string>` (per render cycle) to prevent re-emitting the same goal/debt milestone on every render. Use the dedup layer's existing hour/day/month window to space milestone checks appropriately rather than emitting on every render.

9. **Add notification count limit** — Cap the stored notification list at a reasonable maximum (e.g., 200 most recent). The current store has no limit, which will degrade performance over time.

10. **Expand notification item touch targets** — Increase action button padding to `p-2.5` (minimum 44×44px) for mobile usability. Alternatively, use a swipe gesture library for dismiss and mark-read actions.

11. **Consolidate the two notification APIs** — The public API has two paths: `notify()` (legacy, bypasses the engine) and `emitFinancialEvent()` (engine with dedup and templates). The `notify()` path uses a different fingerprint scheme (`legacy::category::title::relatedId`) which bypasses engine dedup. Consolidate to only `emitFinancialEvent`.
