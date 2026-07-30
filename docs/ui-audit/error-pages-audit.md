# Error Pages & Error Experiences — UI/UX Audit

**Target:** All error surfaces across the Kobo application
**Files:** `src/pages/NotFound.tsx`, `src/components/common/ErrorBoundary.tsx`, `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/VerifyEmail.tsx`, `src/pages/Settings.tsx`, `src/services/firebase/errors.ts`, `src/services/firebase/retry.ts`, `src/services/firebase/status.ts`, `src/services/firebase/auth.ts`, `src/components/auth/ProtectedRoute.tsx`, `src/hooks/use-auth.ts`, `src/store/auth.ts`, `src/contexts/auth-context.tsx`, `src/hooks/use-firebase-status.ts`, `src/services/service-provider.ts`, `src/components/common/EmptyState.tsx`, `src/features/forms/schemas.ts`, `src/features/forms/fields.tsx`, `src/components/ui/form.tsx`, `src/components/ui/sonner.tsx`, `src/hooks/use-session-timeout.ts`
**Framework:** React 18 + TypeScript + Tailwind CSS + Framer Motion + Sonner + Radix UI
**Date:** 2026-07-20

---

## Executive Summary

Kobo has a surprisingly thorough error-handling backbone for an SPA: a centralised error-classification pipeline (`FirebaseServiceError`), exponential-backoff retry with jitter, an offline write queue, network-status monitoring, a well-structured Zod validation layer, and `aria` attributes on most form fields. The *infrastructure* is ahead of many apps of this size.

The *surface* — what users actually see and interact with when things go wrong — does not match the quality of the backend. The 404 page is a two-line placeholder with no branding, no navigation support, and no recovery path beyond "Return to Home". The ErrorBoundary produces a generic "Something went wrong" modal with no diagnostics, no ability to contact support, and no context about what failed. Offline detection exists at the service layer but has no visible UI — users see generic toast notifications or silent failures instead of a meaningful offline banner. Firebase `permission-denied` and `rate-limited` errors are mapped to user-facing messages, but those messages appear only via Sonner toasts or form-level state, never as a persistent banner or modal.

The core gap: **the error classification engine is strong; the error rendering layer is weak.** Many error states degrade to a generic fallback rather than a specific, actionable, well-designed recovery experience.

**Verdict: Infrastructure is solid — UI layer needs a dedicated error-messaging system (persistent banners, contextual recovery, offline indicator, accessible announcements).**

---

## Finding Inventory

Grouped by severity. Line numbers reference source files on `main`.

---

### Critical

#### C1 — 404 page has no navigation, no search, no branding, no emotional design

- **Where:** `src/pages/NotFound.tsx:11-21`
- **What:** The page renders a plain `<main>` with centred `bg-muted`, "404" in `text-4xl`, "Oops! Page not found" in `text-xl`, and a single `<Link>` "Return to Home". No sidebar, no nav, no site logo, no search bar, no suggested links, no illustration, no humour, no personality.
- **Why it's critical:** The 404 page is a brand moment — it's where users land when something goes wrong, and a minimal text-only response erodes trust. Kobo's auth pages have gradients and motion animations; the 404 page has none of that visual language. Users who mistype a URL or follow a broken link have zero recovery options beyond clicking "Return to Home" and starting over.
- **Fix:** Add the app sidebar/nav pattern or at minimum a persistent top bar with the Kobo logo. Add suggested links (Dashboard, Transactions, Settings). Add an illustration (Tier A CSS art or an SVG). Add a search input. Match the animation language from auth pages.

#### C2 — ErrorBoundary has no diagnostics, no contact path, no error-reporting mechanism

- **Where:** `src/components/common/ErrorBoundary.tsx:30-47`
- **What:** When a render error is caught, the boundary shows an `AlertTriangle` icon, "Something went wrong", the error message, and a "Try again" button. No email to support, no "report this error" button, no error ID, no stack trace disclosure (even in dev), no collapsible details.
- **Why it's critical:** The user has no path to report the bug. If "Try again" fails repeatedly, they are stuck in an error loop with no escalation path. This is a trust and data-loss risk.
- **Fix:** Add a "Report issue" button that copies error details to clipboard or opens a mailto. Add an optional collapsible `<details>` with the error message for tech-savvy users. Add a rate-limited retry counter so repeated failures don't cause an infinite render loop.

#### C3 — Offline detection exists at the service layer but has no visible UI

- **Where:** `src/services/firebase/status.ts:42-57` (detection exists), `src/hooks/use-firebase-status.ts` (hook exists but is not consumed by any UI)
- **What:** `startConnectionMonitoring()` listens to `window.online`/`offline` events and updates a module-level `FirebaseStatus`. A React hook (`useFirebaseStatus`) exposes this state. But **no component renders a persistent offline banner**. The `use-firebase-status.ts` hook is never imported anywhere in the UI layer. The only offline handling is in `firebase/auth.ts` `checkOnline()` which throws a `FirebaseServiceError("offline")` — the user then sees a toast or an error alert depending on the calling code, not a persistent banner.
- **Why it's critical:** Users in a tunnel or with spotty connectivity see random generic errors ("An unexpected error occurred") instead of a clear, persistent "You are offline" banner. The offline write queue (`retry.ts`) works silently — users have no way to know their writes are queued.
- **Fix:** Create an `OfflineBanner` component that uses `useFirebaseStatus` and renders a persistent `sticky` top banner when offline, with "You are offline — changes will sync when you reconnect". Show queued-write count. Wire it into `App.tsx`.

#### C4 — No persistent top-level error banner for Firebase connectivity issues

- **Where:** `src/App.tsx:58-97`
- **What:** The app shell has no global error-banner slot. Firebase `unavailable`, `deadline-exceeded`, `internal`, and `permission-denied` errors are handled reactively in individual hooks and pages — they surface as toasts, form alerts, or console errors, but never as a persistent, dismissible top-of-page banner.
- **Why it's critical:** Transient Firebase outages generate a cascade of individual error toasts (one per failed operation), flooding the user. A single "Firebase is experiencing issues — some features may not work" banner is cleaner and less alarming.
- **Fix:** Add a global `FirebaseStatusBanner` component at the `App.tsx` level that monitors `useFirebaseStatus` and shows a dismissible top banner when `connection === "disconnected"` or `isInitialized === false`.

---

### Major

#### M1 — Auth error messages are shown both in a form alert AND from the store, creating duplicates

- **Where:** `src/pages/Login.tsx:76-88`, `src/pages/Register.tsx:114-126`, `src/pages/ForgotPassword.tsx:103-115`
- **What:** Each auth page renders *two* error alert blocks: one for `error` (from the Zustand store, set by `useAuth`'s `extractErrorMessage`) and one for `errors.root` (from react-hook-form, set in the `catch` block of each `onSubmit`). For a single failed sign-in, a user may see the same message rendered twice, or a generic message from the store alongside a specific message from the form.
- **Why it's major:** Duplicate error messages confuse users and violate the principle of single source of truth. The store-level error and the form-level root error are two paths displaying the same information.
- **Fix:** Remove the store-level `error` display from auth pages. Let react-hook-form own the error state entirely — `setFormError("root", ...)` is sufficient. Alternatively, keep store-level errors only for non-form operations (e.g., token refresh failures).

#### M2 — `describeFirebaseError` messages are static and provide no recovery action

- **Where:** `src/services/firebase/errors.ts:98-117`
- **What:** The user-friendly error messages are one-line explanations with no actionable next step: "Network error. Check your connection." / "The operation timed out. Please try again." / "Too many requests. Please slow down." Without action buttons, suggested retry, or a "Learn more" link, the user is left to guess what to do.
- **Why it's major:** Error messages without recovery actions are accusatory rather than helpful. "Check your connection" should be followed by a "Retry" button. "Too many requests" should show a cooldown timer.
- **Fix:** Extend `describeFirebaseError` to return structured objects (`{ title, description, action? }`) and build a dedicated `ErrorAlert` component with retry/dismiss/report actions per error code.

#### M3 — Session timeout has no warning — users lose work silently

- **Where:** `src/hooks/use-session-timeout.ts:29-45`
- **What:** After 30 minutes of inactivity, `signOutUser()` fires silently. No countdown modal, no "Your session will expire in 5 minutes" banner, no prompt to extend the session. The `catch` block is explicitly silent (`// Silent failure on auto-logout`).
- **Why it's major:** Users filling in a long form or reviewing data are suddenly redirected to `/login` with no explanation and no ability to save in-progress work. The `useAuthStore` has `touchActivity()` tracking, so the infrastructure for a warning UI exists.
- **Fix:** at the 25-minute mark, show a modal: "Your session will expire in 5 minutes due to inactivity. Extend session?" At 30 minutes, auto-logout. Use `useSessionTimeout` to expose remaining time and a keep-alive callback.

#### M4 — Settings page password/email/delete errors are displayed as plain `<p>` without consistent styling

- **Where:** `src/pages/Settings.tsx:394-396`, `446-448`, `494-496`
- **What:** Password-change, email-change, and account-deletion errors use raw `<p className="text-xs text-destructive" role="alert">` rather than the `FormMessage` component or the standard `AlertCircle`-icon + border pattern used on auth pages. This breaks visual consistency.
- **Why it's major:** Users see a different error-presentation pattern within the same app. The auth pages use a bordered, icon-bearing alert. Settings uses plain red text with no visual container. This erodes cohesion.
- **Fix:** Replace raw error `<p>` elements with the same `AlertCircle` + border pattern used in auth pages. Or, better, refactor the alert pattern into a shared `InlineError` component.

#### M5 — ProtectedRoute and PublicOnlyRoute redirect silently with no toast/explanation

- **Where:** `src/components/auth/ProtectedRoute.tsx:25-29`, `src/components/auth/PublicOnlyRoute.tsx:25-29`
- **What:** When an unauthenticated user hits a protected route, they are silently redirected to `/login`. When an authenticated user hits a public-only route, they are silently redirected to `/dashboard`. No toast, no flash message, no explanation.
- **Why it's major:** A user who clicks a bookmark to `/settings` while logged out is dumped at `/login` with no context. They know they need to sign in, but they don't know *why* they were redirected (session expired? not logged in? permission denied?). The session-timeout silent redirect compounds this.
- **Fix:** Add a `?reason=session-expired` or `?reason=unauthenticated` query parameter to the redirect URL, and show an appropriate message on the login page. For session timeout specifically, show "Your session expired due to inactivity. Please sign in again."

---

### Minor

#### m1 — `NotFound` component logs to `console.error` but shows nothing in production

- **Where:** `src/pages/NotFound.tsx:8`
- **What:** `console.error("404 Error: User attempted to access non-existent route:", location.pathname)` — useful in dev, silent in production. No analytics event, no error-reporting service call.
- **Fix:** Push a tracking event to an analytics service or extend the `ErrorBoundary` to capture 404s centrally.

#### m2 — ErrorBoundary exposes raw error message to the user

- **Where:** `src/components/common/ErrorBoundary.tsx:41`
- **What:** `this.state.error?.message ?? "An unexpected error occurred"` — if the error message contains internal details (Firebase error codes, internal paths, stack fragments), they are shown verbatim.
- **Fix:** In production, show a generic message ("Something went wrong") and write the real error to console only. Show the full message only in development.

#### m3 — `isLoading` state in auth pages only shows a spinner on the submit button — the form remains interactive

- **Where:** `src/pages/Login.tsx:141-149`, `src/pages/Register.tsx:197-206`, `src/pages/ForgotPassword.tsx:134-143`
- **What:** While `isLoading` is true, the submit button shows a spinner and `disabled`. But the email/password inputs remain editable, the password-toggle buttons are clickable, and the "Forgot password?" / "Create one" links remain active. This allows the user to change form values mid-submission.
- **Fix:** Disable the entire fieldset or form group during loading (`<fieldset disabled={isLoading}>`). Or at minimum add `disabled` to each input when loading.

#### m4 — VerifyEmail page success state uses a full page reload (`window.location.reload()`)

- **Where:** `src/pages/VerifyEmail.tsx:42`
- **What:** "I've verified my email" uses `window.location.reload()` instead of re-checking auth state via Firebase's `onAuthStateChanged`. This causes a hard page reload and flash of loading state.
- **Fix:** Call `getCurrentUser()` or trigger a Firebase auth state refresh instead of a full page reload. Add a brief loading indicator while the verification is re-checked.

#### m5 — Sonner toast configuration is minimal — no error-specific styling, no action buttons

- **Where:** `src/components/ui/sonner.tsx:10-25`
- **What:** The Sonner `Toaster` applies consistent base styling to all toasts but does not differentiate error toasts from success/info toasts via icon colour, border treatment, or action callbacks. When `notify.error()` is called, it looks visually identical to `notify.success()` except for the text.
- **Fix:** Add Sonner's `toastOptions` per-type styling, or pass icon/class overrides in each `notify.error()` call. Consider using Sonner's built-in `type` variants (`toast.error()` vs `toast.success()`) which provide automatic styling.

#### m6 — Form validation error messages are read by screen readers but not visually connected to inputs

- **Where:** `src/pages/Login.tsx:102-104`, `src/pages/Register.tsx:140-142`, `src/features/forms/fields.tsx` (via `FormMessage`)
- **What:** The `aria-describedby` attribute correctly maps `<input>` IDs to error `<p>` IDs, and `aria-invalid` is set. However, `FormMessage` in `src/components/ui/form.tsx:121` uses `role="alert"` which is correct for assertive announcements but causes screen readers to interrupt the user even while they're still typing. The "alert" role is best reserved for form-submission errors, not per-field inline validation.
- **Fix:** Replace `role="alert"` on per-field `FormMessage` with `role="status"` or `aria-live="polite"` to avoid interrupting mid-typing. Reserve `role="alert"` for the form-level root errors only.

#### m7 — `EmptyState` uses `role="status"` which is semantically incorrect

- **Where:** `src/components/common/EmptyState.tsx:31`
- **What:** `role="status"` on the empty-state container announces "status, <title>" to screen readers, but empty-state content is informational (not a status update). This causes screen readers to announce the empty state on every re-render.
- **Fix:** Use `role="region"` with an `aria-label` or `aria-labelledby` referencing the title, so users can navigate to it voluntarily rather than being interrupted.

#### m8 — No error message for `unconfigured` Firebase state shown to end users

- **Where:** `src/services/firebase/auth.ts:15-22`
- **What:** `guardReady()` throws `FirebaseServiceError("unconfigured")` with message "Firebase is not configured. Check your environment variables." This message is intended for developers but will appear verbatim in the error UI if a production build is deployed without Firebase env vars.
- **Fix:** In production, map `unconfigured` to a user-friendly message: "This app is not fully set up yet. Please contact support." Or, show a setup screen instead of a broken app.

#### m9 — `registerSchema` password requirements are strict but the UI does not show them progressively

- **Where:** `src/pages/Register.tsx:20-23`
- **What:** The schema requires 8+ characters, at least one letter, and at least one number. The `password` input placeholder says "At least 8 characters" but doesn't mention the letter+number requirement. Users discover the additional rules only after submitting.
- **Fix:** Show a dynamic strength/meter indicator below the password field that validates each rule in real-time (e.g., green checkmarks for "8+ characters ✓", "Contains a letter ✓", "Contains a number ✓").

#### m10 — `ForgotPassword` success message reveals whether the email exists

- **Where:** `src/pages/ForgotPassword.tsx:63-65`
- **What:** "If an account with that email exists, we have sent a password reset link." The phrasing attempts to be privacy-conscious, but the page's behavior reveals the address' registration status depending on whether the operation succeeds or throws. An attacker can observe the difference between success and error states.
- **Fix:** Always show the same success screen ("If an account exists, a reset link has been sent") regardless of whether the email was found. Remove the CTA that differs between success and error paths.

#### m11 — Retry queue has a maximum of 10 retries but no UI feedback

- **Where:** `src/services/firebase/retry.ts:155-158`
- **What:** The offline write queue retries up to 10 times per entry, with a 30-second interval, but the user sees zero feedback: no badge on the nav, no toast, no banner counting pending writes.
- **Fix:** Expose the queue length via a hook or context. Show a small badge or banner: "3 changes pending — will sync when online."

#### m12 — `useSessionTimeout` has no `clearError` call before silent sign-out

- **Where:** `src/hooks/use-session-timeout.ts:34-39`
- **What:** When the session timeout fires, `signOutUser()` is called but the auth store's `error` and `user` state are not explicitly cleared. The `onAuthChange` listener should fire and clear the user, but if it fails, stale auth state could persist.
- **Fix:** Call `useAuthStore.getState().clearError()` and `useAuthStore.getState().setUser(null)` before signing out.

#### m13 — `setBackend` error in `BackendConnector` is only logged to console

- **Where:** `src/App.tsx:42`
- **What:** `setBackend("firebase", user.uid).catch((err) => { console.error(...) })` — if the Firebase backend switch fails, the user has no indication that they're still on localStorage and their data may not be syncing.
- **Fix:** Show a Sonner toast with "Failed to connect to cloud sync. Your data is saved locally."

#### m14 — No error boundary per route or per section — single global ErrorBoundary

- **Where:** `src/App.tsx:66`
- **What:** A single `ErrorBoundary` wraps all routes. If one section of the dashboard crashes, the entire app shows the generic error view. Users lose access to working sections.
- **Fix:** Wrap individual sections or lazy-loaded routes in their own `ErrorBoundary` instances so a crash in Reports doesn't take down the entire app.

#### m15 — `FirebaseServiceError.timestamp` is unused in the UI

- **Where:** `src/services/firebase/errors.ts:11`
- **What:** Each error is stamped with an ISO timestamp, but it is never shown to the user or included in error reports. This is valuable debugging context.
- **Fix:** Include the timestamp in the collapsible error details (see C2 fix) or in the clipboard payload when a user taps "Report issue".

---

## Accessibility Review

| Finding | Severity |
|---|---|
| Per-field errors use `role="alert"` which interrupts mid-typing (m6) | Minor |
| `EmptyState` uses `role="status"` incorrectly (m7) | Minor |
| `ProtectedRoute` spinner has `role="status"` and `aria-label="Authenticating"` — correct | OK |
| Auth page error alerts have `role="alert"` and `aria-live="polite"` — correct | OK |
| `FormMessage` uses `role="alert"` — correct for form-level errors, too aggressive for per-field | Minor |
| Inputs have `aria-invalid` and `aria-describedby` pointing to error elements | OK |
| Password-toggle buttons have `aria-label` | OK |
| `ErrorBoundary` uses `role="alert"` — correct | OK |
| No `aria-live` region for toast notifications (Sonner handles this internally) | OK |
| No skip-to-content link or keyboard-trap recovery in ErrorBoundary | Minor |
| Offline banner would need `aria-live="polite"` and `role="status"` (not yet implemented) | — |

---

## Error-Type Coverage Matrix

| Error Type | Backend Classification | User-Facing Message | Visual Treatment | Recovery Action |
|---|---|---|---|---|
| 404 / Not Found | Route-level `*` catch | "Oops! Page not found" | Centred text, no icon | "Return to Home" link |
| Firebase `unavailable` | `classifyFirebaseError` → `"unavailable"` | "Service is temporarily unavailable. Please try again." | Toast or form alert | None (no retry button) |
| Firebase `permission-denied` | `"permission-denied"` | "You do not have permission to perform this action." | Toast or form alert | None |
| Firebase `network-error` | `"network-error"` | "Network error. Check your connection." | Toast or form alert | Check connection (no button) |
| Firebase `offline` | `checkOnline()` → `"offline"` | "You are offline. Changes will sync when you reconnect." | Toast or form alert | None (banner missing) |
| Firebase `rate-limited` | `"rate-limited"` | "Too many requests. Please wait before trying again." | Toast or form alert | None (no cooldown timer) |
| Firebase `invalid-argument` | `"invalid-argument"` | "Invalid data provided. Check your input." | Per-field `FormMessage` | Correct field |
| Firebase `not-found` | `"not-found"` | "The requested data was not found." | Toast or form alert | None |
| Firebase `unauthenticated` | `"unauthenticated"` | "You must sign in to perform this action." | Redirect to `/login` | Sign-in flow |
| Session timeout | `useSessionTimeout` | — | None (silent redirect) | Sign-in flow |
| Render crash | `ErrorBoundary` | "Something went wrong" + error message | Full-page fallback | "Try again" button |
| Form validation | Zod schemas | Field-specific messages | Per-field `FormMessage` | Correct field |
| Offline write queue | `retry.ts` | — | None (silent background) | Auto-sync when online |
| Firebase `unconfigured` | `guardReady()` | "Firebase is not configured." | Toast or error | Contact support (? shown to users) |
| Import/export failure | `catch` in Settings | "Import failed" / "Export failed" | Sonner toast | None |

---

## Recovery-Experience Gaps

1. **No retry button on most error toasts.** Sonner supports action buttons; error toasts from `notify.error()` do not use them. Every transient error (network, unavailable, rate-limit) should offer "Retry now".
2. **No offline banner.** The browser goes offline → the user sees generic errors on every interaction, not a clear persistent banner.
3. **No session-expiry warning.** Users lose unsaved work at the 30-minute mark with no countdown.
4. **No error-reporting channel.** The ErrorBoundary has no "Report this issue" path, so bugs in production go unreported.
5. **No toast for queued offline writes.** Users don't know their data is pending sync.
6. **404 has no search or navigation.** Users must click "Return to Home" and navigate again from scratch.

---

## Recommendations (Ranked)

1. **Build a persistent `OfflineBanner`** — consume `useFirebaseStatus`, render a sticky banner at the top of the app when offline. Include queued-write count.
2. **Rework the `ErrorBoundary`** — add "Report issue" (copy error details), collapsed stack trace in dev, rate-limit retry to prevent loops, per-section boundaries instead of a single global one.
3. **Build a dedicated `ErrorAlert` component** — structured error display with icon, title, description, retry action, and report action. Replace all ad-hoc error `<p>` and duplicate alert blocks.
4. **Add session-expiry warning modal** — 5-minute countdown before silent logout, with "Extend session" button.
5. **Redesign the 404 page** — match Kobo's visual language (gradients, motion), add sidebar/nav, add search, add suggested links, add an illustration.
6. **Eliminate duplicate error state** — remove store-level error display from auth pages, keep only react-hook-form root errors.
7. **Add `reason` query parameter to ProtectedRoute redirects** — show contextual messages on the login page (session expired, login required, permission denied).
8. **Add `aria-live="polite"` to a global error region** so screen readers announce persistent errors (offline, connection issues) without interrupting interaction.
9. **Enable per-type Sonner styling** — differentiate error, success, and info toasts via icon colour, border, and treatment.
10. **Add analytics tracking to 404s and ErrorBoundary catches** so the team knows what errors users encounter in production.

---

## Count

**4 critical · 5 major · 15 minor**
