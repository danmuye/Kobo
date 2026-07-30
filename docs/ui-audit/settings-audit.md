# Settings Module UI/UX Audit

**Target:** `/settings` — `src/pages/Settings.tsx` (766 lines)
**Hook:** `src/features/settings/hooks.ts` (34 lines)
**Store:** `src/store/settings.ts` (94 lines) — `AppSettings`, `AppearanceSettings`, `LocalizationSettings`
**Theme:** `src/components/theme-provider.tsx` (90 lines) — light/dark/system, legacy migration
**Notifications:** `src/store/notifications.ts` (86 lines) + `src/types/notifications.ts` (56 lines) — 10 preference keys, `DEFAULT_PREFERENCES`
**Currency:** `src/lib/currency.ts` (66 lines) — 20 currencies, `Intl.NumberFormat` formatting
**Backup:** `src/services/backup.ts` — export/import JSON, deduplication
**Date:** 2026-07-20

---

## Executive Summary

The Settings module is a clean, single-page configuration hub with sections for Profile, Appearance, Security, Sign Out, Localization, Notifications, Backup & Restore, and Data Management. The layout uses a 2-column responsive grid (`md:grid-cols-2`), consistent card styling, and proper confirmation dialogs for all destructive actions. The underlying store (`settings.ts`) is a straightforward Zustand slice with typed patch updaters. The `theme-provider` handles light/dark/system resolution, legacy migration, and system-preference listeners correctly.

Three issues prevent the Settings page from being a polished configuration experience: **(1) notification preferences expose only 6 of 10 available keys** — the `prefDefs` array omits `budgetEndingAlerts`, `budgetEndedAlerts`, `budgetThresholdAlerts`, and `goalMilestoneAlerts`, meaning users cannot control these granular preferences even though the type system and store support them; **(2) there is no category management surface** — categories are implicitly created from transaction data with no way to rename, merge, or delete them; **(3) the `locale` field in `LocalizationSettings` is persisted but has no UI control**, leaving locale permanently pinned to `"en-NG"`.

**Verdict:** A functional, well-structured settings page with good destructive-action safeguards, undermined by incomplete preference exposure, a missing category management feature, and a dead localization field.

---

## UI Review

### Layout & Structure
- `PageHeader` with title "Settings" and subtitle "Make Kobo work the way you do."
- Sections in a `grid gap-4 md:grid-cols-2` layout — 2 columns on desktop, 1 column on mobile
- Sections: Profile (left), Appearance (right), Security (left), Sign Out (right), Localization (full-width, `md:col-span-2`), Notifications (left), Backup & Restore (right), Data Management (full-width)
- All sections use `rounded-xl border bg-card p-5 shadow-elegant` — consistent card styling
- Each section has an `aria-labelledby` pointing to its `<h2>` heading with an optional Lucide icon

### Profile Section
- Full name text input with "Save changes" button (disabled when empty or saving)
- Email input (disabled, `aria-disabled="true"`) — displayed for reference only
- Hint text: "To change your email, use the Security section below."
- "Member since" date from `user.createdAt`
- **Raw `useState` for `profileName`** — inconsistent with the app's react-hook-form pattern
- No unsaved-changes warning if the user navigates away

### Appearance Section
- Theme selection via `RadioGroup` with 3 card-style options: Light (Sun icon), Dark (Moon icon), System (Monitor icon)
- Cards use `has-[:checked]:border-primary` — modern CSS selector, visually clear
- Selected card gets primary border, unselected cards get input border
- `aria-label="Theme selection"` on the radio group
- No theme preview (no live demo of how the theme looks)

### Security Section
- Change Password: 3 fields (current, new, confirm) + "Update password" button — inline validation error
- Change Email: 2 fields (new email, confirm password) + "Change email" button — inline validation error
- Delete Account: `AlertDialog` with password confirmation input + "Delete my account" destructive button
- All 3 sub-forms use **raw `useState`** — inconsistent with the app's react-hook-form pattern
- Password fields have `autoComplete` attributes — good
- `aria-invalid` and `aria-describedby` wired for error states — good
- Error messages use `role="alert"` — good
- Loading states show `Loader2` with `animate-spin` — consistent

### Sign Out Section
- Standalone section card with description text and `AlertDialog`-guarded sign out button
- **Sign Out is a full section card** — could be a button within the Profile or Security section instead of occupying its own 2-column slot

### Localization Section
- Full-width section with 4 selects in `sm:grid-cols-2 lg:grid-cols-4` grid
- Currency: 20 options from `CURRENCIES` array, rendered as `{symbol} — {name} ({code})`
- Live preview: `formatCurrency(1234567)` + symbol display
- Date Format: 3 options with example values
- Number Format: 3 options with example values
- Time Format: 2 options with example values
- **`locale` field exists in `LocalizationSettings` but has no UI** — stored as `"en-NG"` default, never exposed in settings UI, never changeable

### Notifications Section
- 6 toggle rows: Budget alerts, Savings alerts, Debt reminders, Account alerts, Large transaction alerts, Monthly summaries
- Each row: label + description (left), `Switch` component (right)
- `aria-label="Toggle {label}"` on each Switch
- Empty state: "No notification preferences available."
- **4 preference keys are missing from the UI**: `budgetEndingAlerts`, `budgetEndedAlerts`, `budgetThresholdAlerts`, `goalMilestoneAlerts` — these exist in the `NotificationPreferenceKey` type and `DEFAULT_PREFERENCES` but have no toggle surface
- **Budget alerts toggle is overloaded** — its description mentions "80%, 95%, or exceed" thresholds, but the 3 granular budget toggles below it are invisible

### Backup & Restore Section
- Export data button: `downloadBackup()` via hidden file input — outputs JSON
- Import data button: hidden `<input type="file" accept=".json">` triggered programmatically
- Importing state shows "Importing…" label — good feedback
- Both buttons have `aria-label` and Lucide icons (Download/Upload)
- No export options (what to include, format details)
- Import uses `deduplicateById` — good defensive merging

### Data Management Section
- Full-width section with Reset settings and Clear all data buttons
- Both actions guarded by `AlertDialog` with warning icons and descriptive text
- Reset settings: "Your financial data will not be affected." — clear scope
- Clear all data: recommends exporting a backup first — good UX
- Clear all data uses destructive button variant with Trash2 icon

---

## UX Review

### User Workflows
1. **Navigate → Settings** — sidebar link, lazy-loaded route
2. **Update profile name** — edit text → Save changes → toast confirmation
3. **Switch theme** — click Light/Dark/System card → immediate effect
4. **Change password** — 3 fields → Update password → inline error or success toast
5. **Change email** — 2 fields → verification sent → toast
6. **Toggle notification** — Switch → immediate effect
7. **Update localization** — Select dropdown → immediate effect via store
8. **Export backup** — click → browser download → toast
9. **Import backup** — click → file picker → dedup merge → toast
10. **Reset settings** — button → confirm dialog → toast
11. **Clear all data** — button → confirm dialog → toast
12. **Sign out** — button → confirm dialog → redirect to /login

### Discoverability
- Settings is linked in the sidebar — expected location
- Sections are grouped by concern with clear headings and icon indicators
- Destructive actions use red/destructive button variants — immediately identifiable
- Import button is the least discoverable action — it uses the same outline style as Export but with a hidden file input

### Information Architecture
- 8 sections in a 2-column grid — reasonable grouping
- **Sign Out as its own section feels oversized** — it's a single button with a description, occupying the same visual weight as Profile or Security
- **Profile and Security could be merged** — both deal with account management; currently separated by Appearance
- **Backup & Restore and Data Management are adjacent but in different row positions** — Backup is right-column, Data Management is full-width below. Users may miss the logical grouping

### Forms & State Management
- **All form state uses raw `useState`** — profile name, password change, email change, delete account confirmation. This is a significant inconsistency with the rest of the app, which uses `react-hook-form` + `zodResolver` for every other form (transactions, budgets, goals, debts).
- No form-level validation library — inline `if` checks for password length, empty fields, etc.
- No unsaved-changes detection — navigating away from Settings discards any in-progress edits silently
- No `useCallback` wrapping on all event handlers — acceptable but inconsistent

### Notification Preference Gaps
- 6 toggles visible, 10 keys in the type system
- `budgetEndingAlerts`, `budgetEndedAlerts`, `budgetThresholdAlerts` are fully functional in the store but have no toggle in the UI
- The Budget alerts description ("80%, 95%, or exceed") hints at granular thresholds that the user cannot configure

### Missing Settings
- **Category management** — No way to rename, merge, or delete transaction categories. Categories are implicitly created from transaction data and cannot be edited.
- **Account management** — No setting to reorder, hide, or archive accounts (handled implicitly through the finance store).
- **Default account** — No setting for a default transaction account.
- **Dashboard preferences** — No setting for default dashboard view, default date range, or hidden sections.
- **Notification delivery** — No setting for in-app vs email vs push delivery channel.

---

## Accessibility Review

### Passes
- `aria-labelledby` on all section elements pointing to `<h2>` headings
- `aria-label` on theme radio group, currency select, date/number/time format selects, export/import buttons
- `aria-invalid` and `aria-describedby` on password and email form fields with error IDs
- `role="alert"` on inline error messages
- `aria-disabled="true"` on disabled email input
- `aria-hidden` on decorative icons and hidden file input
- `autoComplete` attributes on password and email inputs
- Switch components have `aria-label` for each notification toggle
- `sr-only` class on radio group items — hidden from visual UI but accessible to screen readers
- `focus-visible:ring-2` on all interactive elements

### Fails / Gaps
1. **No `tabular-nums` on any values** — not a critical issue for Settings (few numeric columns) but inconsistent with the rest of the app.
2. **No `prefers-reduced-motion`** — No animations in Settings (only static render), so this is a pass.
3. **Small hint/description text** — `text-xs` (12px) for section descriptions, `text-[10px]` for currency preview details may fail WCAG SC 1.4.4.
4. **Hidden file input for import** — The `<input type="file">` is `sr-only` with `tabIndex={-1}` and `aria-hidden`. The visible button triggers it via `fileInputRef.current?.click()`. This works functionally but the import action has no keyboard-accessible fallback if the ref-based click fails.

---

## Mobile Review

### Breakpoints
| Width | Behavior |
|---|---|
| 320px | All sections stack 1-column. Theme cards stack vertically. Localization grid collapses to 1-col. Forms fit width. |
| 375px | Same as 320 — adequate. Switch toggles have sufficient tap targets. |
| 414px | Comfortable single-column layout. Localization grid 2-col. |
| 768px | 2-column grid activates. All sections pair naturally. |

### Issues
1. **Theme selection cards at narrow widths** — 3 card-style radio options in a `flex` row may be cramped at 320px; `flex-1` ensures they share space but text labels ("Light", "Dark", "System") could truncate or wrap.
2. **Security section sub-forms** — Each sub-form (Change password, Change email) has its own bordered container with 2-3 inputs. At 320px, the padding within nested borders compounds, reducing usable width.
3. **No mobile-specific optimizations** — The page renders the same content and density regardless of viewport, which is acceptable for a settings page.

---

## Performance Perception

### Load
- Page is lazy-loaded via `React.lazy()` in App.tsx — good code splitting
- No page-level loading skeleton — brief flash of empty container before render
- Theme provider has an explicit `ready` state (`useState(false)`) — returns `null` until ready, preventing flash-of-wrong-theme
- No expensive computations — all settings are synchronous store reads

### Render
- No unnecessary re-renders — Zustand selectors are granular
- No `memo()` wrappers on Settings component — acceptable as it's a settings page with minimal re-render churn
- Theme provider uses `useMemo` for context value — good

### Concerns
- **Hidden file input pattern** — A hidden `<input>` in the DOM at all times is clean but unnecessary; could be created ephemerally
- **No pagination or virtualization needed** — Settings is a single-page config with <100 interactive elements

---

## Component Inventory

| Component | File | Lines | Props | Notes |
|---|---|---|---|---|
| Settings (page) | `src/pages/Settings.tsx` | 766 | — | 8 sections, inline forms, raw useState |
| ThemeProvider | `src/components/theme-provider.tsx` | 90 | children | Light/dark/system, legacy migration, system listener |
| useSettings | `src/features/settings/hooks.ts` | 34 | — | Wraps store + service for patch updates |
| useSettingsStore | `src/store/settings.ts` | 94 | — | Zustand, Appearance + Localization slices |
| useNotificationStore | `src/store/notifications.ts` | 86 | — | Notifications array + preferences + CRUD |
| CURRENCIES | `src/lib/currency.ts` | 66 | — | 20 currencies with `Intl.NumberFormat` formatting |
| backup service | `src/services/backup.ts` | — | — | JSON export/import, dedup by ID |

---

## Pain Points

1. **Incomplete notification preference UI** — 4 of 10 preference keys (`budgetEndingAlerts`, `budgetEndedAlerts`, `budgetThresholdAlerts`, `goalMilestoneAlerts`) exist in the type system and store but have no toggle surface. The "Budget alerts" description hints at granular thresholds the user cannot configure.
2. **No category management** — Categories are implicitly created from transaction data with no rename, merge, or delete surface. Users cannot clean up misspelled categories, merge duplicates, or archive unused ones.
3. **Dead `locale` field** — `LocalizationSettings.locale` is persisted (`"en-NG"` default) but has no UI control. Users cannot change their locale independently of currency.
4. **Raw `useState` forms** — Profile, Change Password, Change Email, and Delete Account all use raw `useState` instead of the `react-hook-form` + `zodResolver` pattern used throughout the rest of the app. No validation library, no unsaved-changes detection.
5. **Sign Out as its own section** — A single button with a description occupies the same visual weight as Profile or Security. Could be a button nested within Profile or at the bottom of the page.
6. **Security and Profile split by Appearance** — Profile (left) and Appearance (right) are in the first row; Security is in the second row (left). A user editing their profile might miss the Security section below.
7. **No import/export options** — Export always downloads the full dataset with no format/scope selection. Import always merges with no conflict-resolution UI.

---

## Quick Wins

1. **Expose all 10 notification preference keys** — Add the 4 missing toggles to `prefDefs`: "Budget ending soon alerts", "Budget ended alerts", "Budget threshold alerts", "Goal milestone alerts". Group related toggles with indentation or subheadings.
2. **Add `locale` select to Localization** — Add a locale/language dropdown alongside the existing currency, date, number, and time selects, populated from a `LOCALES` list derived from the currency definitions.
3. **Merge Sign Out into Profile section** — Move the sign out button and confirmation dialog into the Profile section as a secondary action, freeing a grid slot.
4. **Add unsaved-changes warning** — Use `beforeunload` or `react-router`'s `useBlocker` to warn users navigating away with unsaved form edits.
5. **Rename "Data Management" section** — Split into "Reset Settings" and "Danger Zone" (for Clear all data) to better differentiate scope.

---

## Major Improvements

1. **Add category management** — Create a category management surface (either inline in Settings or as a dedicated sub-page) allowing users to rename, merge, and delete categories. Show category usage counts (how many transactions per category) before allowing deletion. This is the most significant missing feature across the entire app.
2. **Refactor forms to `react-hook-form`** — Convert the Profile, Change Password, Change Email, and Delete Account forms from raw `useState` to `useForm` + `zodResolver`, consistent with the rest of the app. This brings validation, error handling, and form state management in line with established patterns.
3. **Add notification grouping with granular controls** — Group notification preferences hierarchically: master toggle per category (Budget, Savings, Debt, Account, etc.) with expandable sub-toggles for granular control. Surface the 4 hidden preference keys under the appropriate groups.
4. **Add export options dialog** — Before exporting, show a dialog with format selection (JSON vs CSV), scope selection (all data vs selected entities), and optionally a date range filter. Same for import: allow selective restore and conflict-resolution options.

---

## Hallmark Recommendations

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Major** | Missing feature (category management) | Nowhere in Settings | Categories are implicit from transaction data; no rename/merge/delete surface | Add category management UI |
| **Major** | Dialog pattern inconsistency | `Settings.tsx:161-239, 284-309` | Profile, password, email, and delete forms use raw `useState` instead of `react-hook-form` | Refactor to `useForm` + `zodSchema` |
| **Major** | Incomplete preference exposure | `Settings.tsx:44-51` | `prefDefs` omits 4 of 10 `NotificationPreferenceKey` values | Add missing toggle rows |
| **Minor** | Dead field (locale) | `store/settings.ts:19` | `locale` is stored and defaulted to "en-NG" but never exposed in UI | Add locale select or derive from currency |
| **Minor** | Oversized singleton action | `Settings.tsx:518-556` | Sign Out is a single button occupying a full section card | Merge into Profile section |
| **Minor** | No unsaved-changes guard | `Settings.tsx:161-174, 182-199` | User can navigate away from Settings with unsaved form edits silently | Add `beforeunload` or `useBlocker` |

### Hallmark Scorecard

| Category | Score | Notes |
|---|---|---|
| Philosophy | 4/5 | Clear configuration hub with well-grouped concerns |
| Hierarchy | 4/5 | Sections are logically ordered, 2-column layout maximizes scanability |
| Execution | 4/5 | Well-typed store, clean theme provider, proper confirmation dialogs |
| Specificity | 3/5 | Missing category management and incomplete notification toggles signal unfinished surface |
| Restraint | 4/5 | No over-engineered settings — clean, direct toggles and selects |
| Variety | 3/5 | All sections use identical card styling; no visual differentiation between primary config and destructive actions |

---

## Actionable UX Recommendations

1. **Add category management.** This is the highest-impact missing feature. Create a dedicated section or sub-page where users can see all unique categories, their transaction counts, and actions to rename or merge. Without this, misspelled or duplicate categories accumulate silently.
2. **Expose all notification preference keys.** The type system and store already support 10 granular toggles. The UI only shows 6. Add the missing 4: "Budget ending soon", "Budget ended", "Budget threshold exceeded", "Goal milestone reached". Group them under their parent categories.
3. **Refactor forms to react-hook-form.** The Profile, Change Password, Change Email, and Delete Account forms are the last remaining raw `useState` forms in the app. Consistent form handling reduces bugs and improves maintainability.
4. **Surface the `locale` setting.** Add a locale/language select dropdown populated from the currency definitions, or derive it automatically from the selected currency and show it as a read-only field.
5. **Merge Sign Out into Profile.** Remove the standalone Sign Out section and add a secondary "Sign Out" button at the bottom of the Profile section. This frees a grid column and groups account-related actions together.
6. **Add export options.** Before triggering a download, show a lightweight dialog with scope selection. Users should be able to export only specific entities (transactions, budgets, goals, etc.) and choose JSON or CSV format.
7. **Add a searchable currency selector.** The current 20-item select dropdown works but offers no search or filtering. As the currency list grows, add typeahead search to the currency select.

---

## Overall Score

**7.4 / 10**

The Settings module is the most structurally complete page in Kobo. The 2-column responsive layout, confirmation-dialog safeguards for all destructive actions, proper ARIA attributes, and clean theme-provider architecture set a high baseline. The `useSettings` hook and `useSettingsStore` provide a simple, well-typed data layer.

The gaps are in surface completeness rather than structural quality. The most significant missing feature — category management — affects the entire app's data hygiene. The 4 hidden notification preference keys represent a data-model-to-UI gap. And the raw `useState` forms are a consistency debt against the rest of the app's `react-hook-form` convention.

**Add category management (major), expose all notification toggles (quick win), and refactor forms for consistency (major).** These changes would bring the score to ~8.5, making Settings the highest-rated module.
