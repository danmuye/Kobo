# Authentication Module UI/UX Audit

**Target:** Login (`Login.tsx`, 199 lines), Register (`Register.tsx`, 255 lines), Forgot Password (`ForgotPassword.tsx`, 158 lines), Verify Email (`VerifyEmail.tsx`, 122 lines)
**Route Guards:** `ProtectedRoute.tsx` (33 lines), `PublicOnlyRoute.tsx` (33 lines)
**Context:** `auth-context.tsx` (91 lines) — Firebase `onAuthStateChanged`
**Hook:** `use-auth.ts` (227 lines) — all auth actions with loading/error management
**Service:** `firebase/errors.ts` (141 lines) — error code mapping to user-friendly messages
**Store:** `store/auth.ts` (39 lines) — user, status, error, loading, session timeout
**Skeleton:** `PageSkeleton.tsx` (54 lines) — `AuthSkeleton` component
**Date:** 2026-07-20

---

## Executive Summary

The Authentication module covers four flows — sign in, registration, password reset, and email verification — plus route guards for protected/public pages. Every flow uses `react-hook-form` with `zod` validation, consistent card-based layout, proper ARIA attributes, and a shared background treatment (`radial-gradient` + `linear-gradient` using theme tokens). The error handling layer (`firebase/errors.ts`) maps Firebase error codes to user-friendly messages with a comprehensive code map covering auth, Firestore, and Storage errors. The `useAuth` hook consistently wraps every action with loading state and error extraction.

Two issues stand out: **(1) the Verify Email page uses `window.location.reload()` to check verification status**, which is a brute-force approach that discards all in-memory state and cannot detect verification without a full round-trip; **(2) there is no password strength indicator during registration** — the zod schema enforces rules (8+ chars, one letter, one number) but users only see error text after submission, not a live gauge or checklist.

**Verdict:** A well-crafted, accessible auth system with consistent patterns and strong error handling, held back by a crude verification-check mechanism and no registration password feedback.

---

## UI Review

### Login (`Login.tsx`)
- Full-screen centered layout with branded background (green-tinted radial gradient + secondary linear gradient)
- `Wallet2` icon in a `h-12 w-12` primary-colored circle
- "Welcome back" heading + "Sign in to your Kobo account" subtitle
- Card form with `shadow-elegant`, `rounded-xl`, `border-border`
- Email input with `autoFocus`, `autoComplete="email"`, placeholder "you@example.com"
- Password input with visibility toggle (Eye/EyeOff icons), `autoComplete="current-password"`
- "Forgot password?" link (right-aligned above password field)
- "Sign in" primary button (full-width, disabled during loading with spinner + "Signing in…")
- "or continue with" divider line with centered text
- Google OAuth button with branded SVG (Google 4-color logo) + "Google" label
- "Don't have an account? Create one" link at bottom
- Uses `react-hook-form` + `zodResolver` with `loginSchema` (email required + valid, password required)
- `noValidate` on form element — disables browser-native validation in favor of custom
- Dual error display: auth-level `error` from store (banner) + form-level `errors.root` (banner) — redundant

### Register (`Register.tsx`)
- Same layout, heading "Create your account", subtitle "Start tracking your finances"
- Three fields: email, password (with visibility toggle), confirm password (with visibility toggle)
- Password validation: min 8 chars, at least one letter, at least one number, must match confirm
- `autoComplete="new-password"` on both password fields
- "Create account" button with "Creating account…" loading state
- Google OAuth with same branded button
- "Already have an account? Sign in" link
- **Success state:** Replaces form with a centered card showing `CheckCircle2` icon, "Account created" heading, verification email instructions, and "Go to sign in" CTA — clean, reassuring transition
- **No password strength indicator** — zod validates on submit but no live feedback (progress bar, checklist, or meter) during typing

### Forgot Password (`ForgotPassword.tsx`)
- Same layout, heading "Reset your password", subtitle "Enter your email and we'll send you a reset link"
- Single email field with `autoFocus`, validation, `autoComplete="email"`
- "Send reset link" button with "Sending…" loading state
- "Back to sign in" link with `ArrowLeft` icon
- **Success state:** "Check your email" card — does not confirm whether the email exists (anti-enumeration security best practice). "If an account with that email exists, we have sent a password reset link."
- No confirmation code input or "didn't receive it?" fallback within the page

### Verify Email (`VerifyEmail.tsx`)
- Interstitial page rendered after registration (before first dashboard access)
- Handles 4 states: initializing (spinner), unauthenticated (redirect to /login), already verified (redirect to /dashboard), unverified (show content)
- Shows user's email (with `user?.email ?? "your email"` fallback)
- "Resend verification email" button with `RefreshCw` icon
- "I've verified my email" button with `ArrowRight` icon — **performs `window.location.reload()`**, a full page reload that discards Zustand stores and forces Firebase `onAuthStateChanged` to re-fire
- Success toast ("Verification email sent") and error toast for resend
- "Sign out" link in the footer text

### Route Guards
- **ProtectedRoute:** Shows centered `Loader2` spinner during initialization, redirects to `/login` if unauthenticated, renders `<Outlet />` if authenticated
- **PublicOnlyRoute:** Same spinner during initialization, redirects to `/dashboard` if authenticated, renders `<Outlet />` if unauthenticated
- Both use `role="status"` and `aria-label="Authenticating"` on the spinner
- Console logging in dev mode for debugging auth state transitions

---

## UX Review

### User Flows
1. **Login:** `/login` → enter email/password → Submit → Firebase auth → redirect to `/dashboard` (via `ProtectedRoute` re-check)
2. **Registration:** `/register` → enter email/password/confirm → Submit → Firebase auth → user document creation → success card → "/login" link
3. **Password Reset:** `/forgot-password` → enter email → Submit → success card → "Back to sign in"
4. **Email Verification:** post-registration → `/verify-email` → resend if needed → "I've verified" → full reload → redirect to `/dashboard`
5. **Auth Guarding:** Any protected route → `ProtectedRoute` → initialization spinner → redirect or content

### Discoverability
- Auth pages are linked from each other — Login has "Create one" (→ Register) and "Forgot password?" (→ ForgotPassword); Register has "Sign in" (→ Login); ForgotPassword has "Back to sign in" (→ Login); VerifyEmail has "Sign out" (→ Login)
- Google OAuth is present on both Login and Register — consistent
- No "Why do I need to verify?" explanation on the Verify Email page beyond the instruction text

### Loading States
- **Initial (auth provider initializing):** `ProtectedRoute`/`PublicOnlyRoute` show a centered spinner — handled before any page renders
- **Suspense fallback (lazy-loaded page loading):** `AuthSkeleton` component — a nicely crafted placeholder matching the auth card layout (circle + 2 lines + 3 skeleton inputs + bottom link)
- **Form submission:** Button transforms to spinner + text ("Signing in…", "Creating account…", "Sending…") — consistent
- **Verify email resend:** Button shows `Loader2` spinner during resend

### Error Handling
- Auth-level errors: displayed as banners with `AlertCircle` icon, `role="alert"`, `aria-live="polite"` — automatically shown from `useAuth` store
- Form-level errors: field-level validation messages (red, `text-xs`) below each input + root-level error banner for API errors
- Firebase error codes mapped to user-friendly messages in `errors.ts` — covers 30+ error codes across auth, Firestore, and Storage
- Dev-mode console logging with grouped error details — useful for debugging

### Dual Error Display
- Login, Register, and ForgotPassword all render both `error` (from `useAuth` store) AND `errors.root` (from `react-hook-form`). Since `useAuth` actions throw on failure (which triggers `setFormError("root")`), the `error` banner from the store and the `errors.root` banner can both render simultaneously for the same error event. This creates visual redundancy.

---

## Accessibility Review

### Passes
- `role="alert"` and `aria-live="polite"` on all error banners
- `aria-invalid` on inputs with validation errors
- `aria-describedby` linking to error message IDs
- `aria-label` on password visibility toggle ("Show password" / "Hide password")
- `aria-label` on route guard spinner ("Authenticating")
- `autoFocus` on primary email input in Login, Register, ForgotPassword
- `autoComplete` attributes on all form fields (email, current-password, new-password)
- Focus-visible ring on all interactive elements (`focus-visible:ring-2 focus-visible:ring-ring`)
- Semantic heading hierarchy (`h1` → form labels → button text)
- `noValidate` disables browser validation — custom validation is more reliable and accessible
- Loading spinner has `role="status"` and `aria-label`

### Fails / Gaps
1. **Verify Email reload is inaccessible** — `window.location.reload()` is triggered by a button click; there is no feedback that a reload is happening (the button just shows a spinner briefly). Screen readers get no announcement of the state transition.
2. **Error announcements** — Error banners use `aria-live="polite"` which announces when content changes. However, the dual error rendering (store error + form root error) can cause duplicate announcements.
3. **No password strength live region** — Registration password rules are enforced via zod on submit but no `aria-live` region announces password requirements during typing.
4. **Success states not announced** — Register and ForgotPassword success states replace the form with a new view, but no `aria-live` region or focus management moves the user to the new content. Screen readers may not detect the transition.
5. **Google OAuth button has no unique accessible name** — The button text is "Google" with no additional context about what signing in with Google does.

---

## Mobile Review

### Breakpoints
| Width | Behavior |
|---|---|
| 320px | Full-width card with `p-4` body padding. Form inputs fill width. Password toggle button positioned inside input. "or continue with" divider fits. |
| 375px | Same as 320 — comfortable. |
| 414px | Room to breathe. Card padding could be `p-6` at this width. |
| 768px | Same layout as desktop — card is `max-w-sm` so it doesn't expand. |

### Issues
1. **No mobile-specific optimizations needed** — The auth pages are already mobile-first: `max-w-sm` card, full-width inputs, stacked layout. They work well at all widths.
2. **Password toggle button** — The `-translate-y-1/2` positioning for the eye icon inside the input field is correctly implemented and works on touch devices.
3. **Verify Email page** — The "I've verified my email" button triggers a full page reload; on mobile this can feel especially jarring with potential network delays.

---

## Theme Support

- All auth pages use CSS custom properties (`hsl(var(--background))`, `hsl(var(--card))`, `hsl(var(--border))`, `hsl(var(--primary))`, `hsl(var(--secondary))`, `hsl(var(--foreground))`, `hsl(var(--muted-foreground))`, `hsl(var(--destructive))`)
- Background uses `radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 34%)` with a green accent — this hardcodes `rgba(16, 185, 129, …)` (emerald-500) rather than deriving from a theme token. In dark mode the green glow may appear differently than intended.
- Card-based forms inherit theme styling automatically — seamless light/dark switching
- `shadow-elegant` token is used on all cards — same shadow-glow-on-dark concern identified in the Dashboard audit if shadow tokens aren't overridden in `.dark`

---

## Performance Perception

### Load
- All auth pages are lazy-loaded via `React.lazy()` in App.tsx — good code splitting
- `AuthSkeleton` is the Suspense fallback — matches the auth page shape
- `AuthProvider` (`auth-context.tsx`) subscribes to Firebase `onAuthStateChanged` once on mount — clean setup
- Route guards check `isInitializing` before rendering — prevents flash-of-wrong-content

### Render
- No unnecessary re-renders — simple components with minimal state
- Zustand store selector pattern is granular (`useAuthStore((s) => s.user)`)
- Google OAuth button renders a full SVG inline — small (24x24) and acceptable

### Concerns
- **Verify Email `window.location.reload()`** — Destroys all Zustand in-memory state, forces Firebase re-initialization, causes a full React tree unmount/remount. On slow connections this can take seconds.
- **No progressive enhancement** — Auth forms use `noValidate` and rely entirely on JavaScript validation. If JS fails to load, forms submit without client-side validation (though server-side validation via Firebase still protects the backend).

---

## Component Inventory

| Component | File | Lines | Props | Notes |
|---|---|---|---|---|
| Login | `src/pages/Login.tsx` | 199 | — | react-hook-form + zod, Google OAuth, password toggle |
| Register | `src/pages/Register.tsx` | 255 | — | 3 fields, success state card, Google OAuth |
| ForgotPassword | `src/pages/ForgotPassword.tsx` | 158 | — | Email-only, success state with security-conscious message |
| VerifyEmail | `src/pages/VerifyEmail.tsx` | 122 | — | Interstitial, resend + reload check |
| ProtectedRoute | `src/components/auth/ProtectedRoute.tsx` | 33 | — | Spinner during init, redirect to /login |
| PublicOnlyRoute | `src/components/auth/PublicOnlyRoute.tsx` | 33 | — | Spinner during init, redirect to /dashboard |
| AuthProvider | `src/contexts/auth-context.tsx` | 91 | children | Firebase onAuthStateChanged subscriber |
| useAuth | `src/hooks/use-auth.ts` | 227 | — | All auth actions, loading/error state |
| AuthSkeleton | `src/components/ui/PageSkeleton.tsx` | 20 (within 54) | — | Lazy-load placeholder matching auth card layout |
| FirebaseError | `src/services/firebase/errors.ts` | 141 | — | Code mapping → user-friendly messages |

---

## Pain Points

1. **Verify Email uses `window.location.reload()`** — The "I've verified my email" button performs a full page reload instead of using Firebase's `user.reload()` + `onAuthStateChanged` to detect verification status in-memory. This discards all Zustand state, forces a full React remount, and provides no loading feedback beyond a brief spinner on the button.
2. **No password strength indicator** — The registration form enforces rules (8+ chars, one letter, one number) but only shows errors on submit. No live checklist, progress bar, or meter during typing.
3. **Dual error rendering** — Auth pages render both the store-level `error` banner and the form-level `errors.root` banner. Since `useAuth` actions throw on failure (triggering `setFormError("root")`), both banners appear simultaneously for the same error.
4. **Background gradient hardcodes emerald-500** — `rgba(16, 185, 129, 0.12)` is the green-500 value hardcoded in the `radial-gradient` on all four auth pages. If the theme accent changes or dark mode needs a different glow, this is a manual change in four places.
5. **Verify Email doesn't auto-detect verification** — Users must click "I've verified" rather than having the page automatically detect when the email is verified (Firebase `onAuthStateChanged` fires with `emailVerified: true` after verification).

---

## Quick Wins

1. **Replace `window.location.reload()` with `user.reload()`** — In `VerifyEmail`, call `await user.reload()` then check `user.emailVerified` from the updated context. If verified, navigate to `/dashboard` programmatically. This eliminates the full reload.
2. **Consolidate error display** — Remove the redundant `error` banner in favor of only `errors.root` from react-hook-form. Or strip `setFormError("root", ...)` and rely solely on the store-level `error` banner. Either way, don't show both.
3. **Extract shared auth page layout** — The header block (`Wallet2` icon + circle + heading + subtitle) and background gradient are duplicated verbatim across all 4 auth pages. Extract to a shared `AuthLayout` component.
4. **Add auto-detect for email verification** — Use a `useEffect` + polling or `onAuthStateChanged` listener in `VerifyEmail` to detect when `emailVerified` becomes true, then auto-navigate to `/dashboard`.
5. **Announce success states** — Add `aria-live="polite"` region in Register and ForgotPassword success views so screen readers announce the state change.

---

## Major Improvements

1. **Add password strength indicator during registration** — Show a live checklist (8+ characters ✓, contains letter ✓, contains number ✓) or a strength meter (Weak / Fair / Strong) that updates as the user types. This reduces submission errors and improves the registration experience. Use the existing zod schema rules as the source of truth.
2. **Verify Email auto-polling with graceful timeout** — After registration, poll `user.reload()` every 3-5 seconds for up to 5 minutes. If verified, auto-navigate to dashboard. Show the "I've verified" button as a fallback for users who verify in another tab. Show a "Still waiting?" message after 2 minutes with a "Resend email" link.
3. **Add "Remember me" to Login** — A checkbox that extends the session timeout or sets a persistent auth state (`browserLocalPersistence` vs `browserSessionPersistence`). Without this, users are re-authenticated on every browser restart.
4. **Add passwordless/magic-link login** — An alternative to email+password for users who prefer one-click auth. Firebase supports it via `sendSignInLinkToEmail`.

---

## Hallmark Recommendations

| Severity | Anti-pattern | Where | Why | Fix |
|---|---|---|---|---|
| **Critical** | Full page reload for state check | `VerifyEmail.tsx:42` | `window.location.reload()` to check verification destroys Zustand state and causes full remount | Replace with `user.reload()` + programmatic navigation |
| **Major** | No password feedback | `Register.tsx:19-29` | Zod validates password rules on submit but no live indicator during typing | Add live checklist or strength meter |
| **Minor** | Dual error display | `Login.tsx:76-88`, `Register.tsx:114-126`, `ForgotPassword.tsx:103-115` | Store-level `error` and form-level `errors.root` render simultaneously for the same event | Consolidate to one error source |
| **Minor** | Hardcoded brand color | `Login.tsx:54`, `Register.tsx:64,91`, `ForgotPassword.tsx:51,78`, `VerifyEmail.tsx:49` | `rgba(16, 185, 129, 0.12)` (emerald-500) hardcoded in background gradient | Derive from theme token |
| **Minor** | Duplicate layout | All 4 auth pages | Logo circle + heading + subtitle + background duplicated verbatim | Extract to shared `AuthLayout` component |

### Hallmark Scorecard

| Category | Score | Notes |
|---|---|---|
| Philosophy | 5/5 | Clear, focused auth flows with security best practices (anti-enumeration in password reset) |
| Hierarchy | 5/5 | Single-column card layout, proper heading hierarchy, clear visual focus on the form |
| Execution | 4/5 | Well-typed forms, consistent error handling, comprehensive Firebase error mapping |
| Specificity | 4/5 | Branded logo, Google OAuth with real SVG, consistent card design |
| Restraint | 4/5 | No over-engineered auth — just email/password + Google, focused on what's needed |
| Variety | 4/5 | All auth pages follow the same layout, which is appropriate for a cohesive auth experience |

---

## Overall Score

**8.2 / 10**

The Authentication module is the highest-quality UI surface in Kobo. Every form uses `react-hook-form` with `zod`, every error state is handled with proper ARIA attributes, every loading state has visual feedback, and the route guards prevent unauthenticated access cleanly. The Firebase error mapping layer is comprehensive and generates user-friendly messages for 30+ error codes. The registration success state and password-reset success state provide reassuring post-submission feedback.

The two genuine weaknesses are the Verify Email page's `window.location.reload()` (a brute-force approach that destroys all in-memory state) and the lack of a password strength indicator during registration (a common UX best practice that reduces user frustration). The dual error display (both store-level and form-level banners) is a minor consistency issue.

**Replace the full page reload with `user.reload()` in Verify Email (critical), add a password strength indicator during registration (major), and consolidate the error display (quick win).** These changes would bring the score to ~9.0.
