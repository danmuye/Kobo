# Landing Page UI/UX Audit — Kobo

**Source:** `src/pages/Index.tsx`
**Route:** `/` (defined in `src/App.tsx` line 68)
**Audit method:** Hallmark (design audit verb)
**Pre-emit critique:** P4 H3 E3 S4 R3 V3

---

## 1. Overall Layout

**Structure (top to bottom):** Single `<div>` wrapper → `<main>` → `<header>` → `<section>` (hero, two-column split) → `<section id="features">` (three-card grid). No `<footer>` element — the page ends abruptly after the features section.

| # | Section | Lines | Purpose |
|---|---------|-------|---------|
| 1 | Background wrapper | 35–40 | Full-viewport backdrop: radial gradient (top-left, emerald 16%) + linear gradient (135deg, background → secondary/0.8) |
| 2 | Header / nav | 43–56 | Logo + brand name + ghost "Open Dashboard" link (desktop only) |
| 3 | Hero section | 58–144 | Two-column split: left = value prop + CTAs + stats strip; right = "This month at a glance" sample summary card |
| 4 | Features section | 146–169 | Section head + three-card grid of product capabilities |

**Key finding:** The entire page is a single 173-line component with zero sub-components extracted. No footer exists.

---

## 2. Navigation

### Header Layout
Centered flex row inside a `rounded-full` container with `bg-background/70` + `backdrop-blur`. Sits inside `<main>` (not full-bleed).

### Logo Placement
Left side. A circular primary-colored pill (`h-9 w-9`) with `Wallet2` icon. Beside it, stacked text:
- **Kobo** — `text-sm font-semibold`
- **Personal Finance Manager** — `text-xs text-muted-foreground`

### Navigation Items
**None.** The header contains zero navigation links — no About, no Features, no Pricing, no Blog. Only a single "Open Dashboard" button.

### CTA Buttons
- Header: "Open Dashboard" (`variant="ghost"`, `hidden sm:inline-flex`)
- Hero: "Open Dashboard →" (`size="lg"`, primary, with `ArrowRight` icon)
- Hero: "Review transactions" (`size="lg"`, `variant="outline"`)

### Mobile Navigation
The ghost button in the header is `hidden sm:inline-flex` — it disappears on mobile. On mobile, the header shows only the logo/brand text. **No hamburger menu, no bottom nav, no sticky nav, no way to navigate** except scrolling down to the hero CTAs.

---

## 3. Hero Section

### Headline
`"Take control of your money with clarity and calm."` — 12 words
- Typography: `text-4xl` → `sm:text-5xl` → `lg:text-6xl`, `font-semibold`, `tracking-tight`
- Max width: `max-w-2xl`
- Color: `text-foreground`

### Subheadline
`"Track budgets, goals, debts and accounts in one responsive workspace designed for everyday decisions."` — 17 words
- Typography: `text-lg`, `text-muted-foreground`
- Max width: `max-w-xl`

### CTA Buttons
Two buttons, stacked vertically on mobile (`flex-col`), side-by-side on `sm:` (`sm:flex-row`):
1. **Open Dashboard** — `size="lg"`, `gap-2`, primary variant, with `ArrowRight` icon
2. **Review transactions** — `size="lg"`, `variant="outline"`

### Images / Illustrations
**None.** No product screenshot, no hero image, no illustration, no demo video. The right column contains a text-only summary card.

### Background
Applied to the outer wrapper (`div` wrapping `<main>`):
```
radial-gradient(circle at top left, rgba(16, 185, 129, 0.16), transparent 34%),
linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.8) 100%)
```
A subtle emerald glow at the top-left corner blending into a soft gradient.

### Layout
`lg:grid-cols-[1.1fr_0.9fr]` — left column 1.1fr, right 0.9fr. Stacks vertically below `lg:`.
- Left column: `space-y-6` (badge → headline + sub → CTAs → pillars strip)
- Right column: summary card with `rounded-3xl border bg-card/80 backdrop-blur shadow-elegant`

### Spacing
- Hero vertical: `py-12` → `lg:py-20`
- Grid gap: `gap-10`
- Left column internal: `space-y-6`

### Visual Hierarchy
1. Badge chip (emerald pill, `text-sm`, low weight) — informational "Local-first, beautifully organized finance tracking"
2. H1 (`text-4xl–6xl`, semibold) — strongest element
3. Subheadline (`text-lg`, muted) — secondary
4. CTA row — two buttons, primary first
5. Pillars strip (4 mini-cards) — tertiary proof points

---

## 4. Every Remaining Section

### 4a. Pillars Strip (hero left column, lines 87–94)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Showcase quick stats / credibility signals |
| **Components** | 4 mini-cards in a responsive grid |
| **Cards** | `rounded-xl border border-border/70 bg-card/80 px-3 py-3 shadow-sm` |
| **Typography** | Value: `text-sm font-semibold text-foreground` · Label: `text-xs text-muted-foreground` |
| **Content** | "5 live accounts" · "8 active categories" · "4 milestones" · "3 obligations" |
| **Grid** | `sm:grid-cols-2` → `xl:grid-cols-4` |
| **Verdict** | **Fabricated metrics.** No connection to user data. Hallmark slop-test gate 46 failure. |

### 4b. "This Month at a Glance" Summary Card (hero right column, lines 97–143)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Demonstrate product dashboard with sample data |
| **Outer card** | `rounded-3xl border border-border/70 bg-card/80 p-6 shadow-elegant backdrop-blur` |
| **Inner card** | `rounded-2xl border border-border/70 bg-background/90 p-5` |
| **Badge** | "+12.4% saved" — emerald pill, top-right. **Fabricated metric.** |
| **Header** | "This month at a glance" (`text-sm font-semibold`) + subtitle (`text-xs text-muted-foreground`) |
| **Rows** | 3 rows, each `rounded-2xl border border-border/60 bg-secondary/50 p-4` |

| Row | Label | Value | Bar color | Bar width |
|-----|-------|-------|-----------|-----------|
| 1 | Income | ₦1.4M | emerald (`bg-emerald-500`) | 78% |
| 2 | Expenses | ₦1.1M | rose (`bg-rose-500`) | 64% |
| 3 | Emergency fund | ₦1.25M | sky (`bg-sky-500`) | 62% |

- **Progress bars:** `h-2 rounded-full` track (`bg-background`) + `h-2 rounded-full` fill
- **Spacing:** `space-y-3` between rows
- **Critique:** Looks like real data but is entirely fabricated. The percentages don't correlate with the ₦ amounts shown.

### 4c. Features Section (lines 146–169)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Explain three core value propositions |
| **Section head** | `<h2>` = `text-2xl font-semibold tracking-tight` · subtitle = `text-sm text-muted-foreground`, `mt-2` offset |
| **Grid** | `md:grid-cols-3`, `gap-4` |
| **Card component** | `<Card>` with `border-border/70 bg-card/80 shadow-sm` |
| **Icon container** | `h-10 w-10 rounded-xl bg-primary/10 text-primary` |
| **Icon size** | `h-5 w-5` |

| Card | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | `Wallet2` | Full money visibility | "Track balances, cash flow, and recurring activity from a single calm workspace." |
| 2 | `BarChart3` | Budget with confidence | "Set spending limits, monitor progress, and stay ahead of month-end surprises." |
| 3 | `Target` | Plan for what matters | "Build savings goals, manage debt payments, and keep long-term decisions visible." |

- **Typography:** `CardTitle` = `text-lg` · body = `text-sm text-muted-foreground`
- **Alignment:** Left-aligned within each card
- **CTA:** **None.** No "Learn more" or "Get started" link on any card.
- **Spacing:** `mb-6` below section head · `gap-4` grid gap · `pb-16` bottom padding on section
- **Responsive:** Falls to `grid-cols-1` below `md:` (Tailwind default)

---

## 5. Footer

**There is no footer.** The page ends at `</section>` → `</main>` → `</div>`.

| Element | Status |
|---------|--------|
| Navigation links | Missing |
| Social icons | Missing |
| Copyright | Missing |
| Branding | Missing |
| Secondary CTAs | Missing |

Users who scroll to the bottom have no next action, no context, no way to navigate elsewhere.

---

## 6. Design System

### Color Palette
HSL-based custom properties defined in `src/index.css`:

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--background` | 220 30% 98% | 222 47% 6% |
| `--foreground` | 222 47% 11% | 220 15% 92% |
| `--primary` | 159 64% 36% (emerald) | 159 64% 45% |
| `--primary-foreground` | 0 0% 100% | 222 47% 6% |
| `--primary-glow` | 159 70% 50% | 159 70% 55% |
| `--secondary` | 220 25% 95% | 222 35% 14% |
| `--muted` | 220 20% 94% | 222 35% 14% |
| `--muted-foreground` | 220 10% 45% | 220 10% 60% |
| `--border` | 220 20% 90% | 222 35% 18% |
| `--success` | 142 71% 45% (green) | 142 65% 48% |
| `--warning` | 38 92% 50% (amber) | 38 92% 55% |
| `--destructive` | 0 72% 51% (red) | 0 72% 55% |

**Observation:** No accent color distinct from primary. The `--accent` token maps to `--secondary` range, not a separate hue.

### Typography
| Face | CSS Variable | Usage |
|------|-------------|-------|
| Inter | `font-sans` | Body text, page copy |
| Plus Jakarta Sans | `font-display` | Defined in Tailwind config but **never used on the landing page** |
| JetBrains Mono | `font-mono` | Defined but unused on this page |

- Body: `font-sans` (Inter), `antialiased`, `font-feature-settings: "cv11", "ss01"`
- Weight scale: `font-medium`, `font-semibold`, `font-bold` (no `font-light` or `font-extrabold` used)
- The landing page never invokes the display font despite it being configured.

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.75rem` (12px) | Root level |
| `rounded-sm` | calc(12px - 4px) = 8px | — |
| `rounded-md` | calc(12px - 2px) = 10px | Buttons |
| `rounded-lg` | 12px | Cards, feature cards |
| `rounded-xl` | 12px + Tailwind scale | Pillars cards, icon containers |
| `rounded-2xl` | 16px | Summary card inner items |
| `rounded-3xl` | 24px | Summary card outer |
| `rounded-full` | 9999px | Header, badge chip, progress bars |

**Observation:** Landing page uses `rounded-xl` through `rounded-3xl` and `rounded-full`. The inconsistency between shadcn's `rounded-lg` (the Card component default) and the hero's `rounded-3xl` creates a slightly mismatched radii language.

### Shadows
| Utility | Token | Value |
|---------|-------|-------|
| `shadow-sm` | `--shadow-sm` | `0 1px 2px hsl(222 47% 11% / 0.04)` |
| `shadow-elegant` | `--shadow-md` | `0 4px 12px hsl(222 47% 11% / 0.08)` |
| `shadow-elevated` | `--shadow-lg` | `0 12px 32px hsl(222 47% 11% / 0.12)` |
| `shadow-glow` | `--shadow-glow` | `0 8px 24px hsl(159 64% 36% / 0.25)` (unused on this page) |

### Gradients
| Variable | Definition | Used on page? |
|----------|-----------|---------------|
| `--gradient-primary` | `135deg, hsl(159 64% 36%), hsl(159 70% 50%)` | No |
| `--gradient-income` | `135deg, hsl(142 71% 45%), hsl(160 70% 55%)` | No |
| `--gradient-expense` | `135deg, hsl(0 72% 51%), hsl(14 80% 60%)` | No |
| `--gradient-savings` | `135deg, hsl(217 91% 60%), hsl(259 80% 65%)` | No |
| `--gradient-card` | `135deg, hsl(0 0% 100%), hsl(220 30% 98%)` | No |
| Inline radial + linear | `radial-gradient(...) linear-gradient(...)` | Yes — page background |

### Glassmorphism
Used extensively:
- Header: `bg-background/70 backdrop-blur`
- Summary card outer: `bg-card/80 backdrop-blur`
- Summary card inner: `bg-background/90` (no blur, but layered transparency)
- Feature cards: `bg-card/80`
- Pillars cards: `bg-card/80`

**Note:** All glassmorphism uses `bg-<token>/<opacity>` without `backdrop-blur` on some cards (features, pillars) — inconsistent application.

### Icon Style
Lucide React icons. Standardized at `h-4 w-4` for most uses, `h-5 w-5` inside feature card icon containers (`h-10 w-10`). Stroke-based, 2px stroke, rounded caps.

### Button Styles
shadcn/ui CVA with variants:
| Variant | Style | Used for |
|---------|-------|----------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | Primary CTA |
| `outline` | `border border-input bg-background hover:bg-accent` | Secondary CTA |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | Header nav link |

Size variants used: `default` (`h-10 px-4 py-2`), `lg` (`h-11 rounded-md px-8`).

### Card Styles
shadcn/ui Card — `rounded-lg border bg-card text-card-foreground shadow-sm`. Landing customises with additional `border-border/70 bg-card/80 shadow-sm` classes for the frosted appearance.

### Animations
Framer Motion:
- Left column: `initial: { opacity: 0, y: 18 }` → `animate: { opacity: 1, y: 0 }`, `duration: 0.45`
- Right column: `initial: { opacity: 0, y: 20 }` → `animate: { opacity: 1, y: 0 }`, `duration: 0.5, delay: 0.08`
- No `whileInView`, no scroll triggers, no staggered children, no exit animations

### Hover Effects
- Buttons: built-in CVA hover states (`hover:bg-primary/90`, etc.)
- Cards: **No hover effects.** No lift, no shadow change, no scale. Feature cards and pillars cards are static.

---

## 7. Responsive Behaviour

| Section | Desktop (>1024px) | Tablet (768–1023px) | Mobile (<768px) |
|---------|-------------------|---------------------|-----------------|
| **Wrapper** | `max-w-7xl`, `px-10` | `px-8` | `px-6` |
| **Header** | Logo + "Open Dashboard" ghost button | Logo + button | Logo only. No hamburger. No nav. |
| **Hero grid** | Two columns (1.1fr / 0.9fr) | Stacks vertical, `gap-10` | Same as tablet |
| **H1** | `text-6xl` | `text-5xl` | `text-4xl` |
| **CTA row** | Side-by-side | Side-by-side | Stacked (`flex-col`) |
| **Pillars** | `xl:grid-cols-4` (4 in a row) | `sm:grid-cols-2` (2×2) | 2 columns (2×2) |
| **Summary card** | Right column | Below CTAs, full width | Below CTAs, full width |
| **Features grid** | `md:grid-cols-3` | 3 columns | 1 column (stacked) |

### Responsive Issues
1. **No mobile navigation** — zero way to navigate on mobile except scrolling to hero CTAs
2. **Pillars `xl:` threshold** — between `sm: (640px)` and `xl: (1280px)`, pillars display as 2 columns. Landscape tablets (1024px) get only 2 columns despite having room for 4
3. **No breakpoint-specific spacing adjustments** — `py-12` to `lg:py-20` is the only vertical spacing breakpoint
4. **No horizontal overflow protection** — no `overflow-x-clip` on root elements for edge cases

---

## 8. UX Evaluation

### What Works Well
- Calm, trustworthy palette — emerald accent on neutral greys suits personal finance
- Consistent glassmorphism language across header and cards
- Strong benefit-oriented H1
- Left-column hero reads naturally: benefits → actions → proof
- Progress bars in summary card are familiar, scannable
- Subtle motion (0.45–0.5s fade-ins) without distraction
- Dark mode is fully supported via `.dark` class

### What Feels Outdated / Problematic
| Issue | Severity | Details |
|-------|----------|---------|
| **No footer** | High | Page ends abruptly; no next action for users who scroll to bottom |
| **Fabricated metrics** | High | All stats are invented ("+12.4% saved", "5 live accounts", etc.) — Hallmark slop-test gate 46 |
| **No mobile navigation** | High | Mobile header shows logo only — no menu, no links, no way to navigate |
| **No features CTA** | Medium | Three feature cards describe capabilities but offer no link to try/learn more |
| **No social proof** | Medium | Zero testimonials, user counts, logos, or trust signals |
| **No email capture** | Medium | No newsletter, waitlist, or lead gen form |
| **No imagery** | Medium | A finance app dashboard screenshot would outperform the text-only summary card |
| **Single-file component** | Low-Medium | Inline-all-the-things approach doesn't scale; any page growth requires a refactor |

### Accessibility Issues
- Logo icon (`Wallet2`) has no `aria-label` or accessible name
- Progress bars lack `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- "+12.4% saved" badge is semantic-less (`div` with text)
- `text-muted-foreground` (`--muted-foreground`: HSL 220 10% 45%) against `--background` (HSL 220 30% 98%) is approximately 3.5:1 — borderline for WCAG AA on small text
- Text-xs labels in pillars strip may be difficult to read for low-vision users
- No `prefers-reduced-motion` media query — framer-motion animations play regardless
- No `role="img"` on decorative icon containers
- No landmarks beyond implicit `<header>`, `<main>`, `<section>` — no `aria-labelledby`

### Visual Hierarchy Issues
- Hero summary card competes with headline — both columns are nearly equal width (1.1fr vs 0.9fr)
- Fabricated pillars data occupies real estate without doing real persuasive work
- Features section head at `text-2xl` is a steep drop from H1's `text-6xl`, but the transition feels abrupt
- No visual divider between hero and features section — `pb-16` on features is the only clue

### Spacing Issues
- Features section `pb-16` is the last spacing — no padding after it. The page just stops.
- Between hero bottom and features section head: the gap includes `pb-16` (features) but no explicit spacing on the hero's bottom
- No spacing scale visible in the page — Tailwind's 4pt scale is used but not consistently

### Conversion Issues
- **No trust signals:** testimonials, user counts, security badges, press logos — all absent
- **No secondary CTA after hero:** features section has no "Get Started" or "Learn More" link
- **No email capture:** no way to capture leads, no newsletter, no early-access
- **Mobile users cannot navigate:** the only internal link on mobile is in the hero CTAs
- **No footer:** zero conversion opportunities at scroll-bottom

---

## 9. Component Inventory

| Component | Source | Usage Count | Details |
|-----------|--------|-------------|---------|
| `Button` | `@/components/ui/button` | 3 | Header ghost, hero primary + outline |
| `Card` | `@/components/ui/card` | 3 | Feature cards |
| `CardHeader` | `@/components/ui/card` | 3 | Feature card headers |
| `CardTitle` | `@/components/ui/card` | 3 | Feature card titles |
| `CardContent` | `@/components/ui/card` | 3 | Feature card bodies |
| `motion.div` | `framer-motion` | 2 | Hero left + right columns |
| `Link` | `react-router-dom` | 3 | Header CTA, hero CTAs |
| `ArrowRight` | `lucide-react` | 1 | Primary CTA icon |
| `BarChart3` | `lucide-react` | 1 | Feature card 2 |
| `Landmark` | `lucide-react` | 1 | Unused in JSX (imported but not rendered) |
| `ShieldCheck` | `lucide-react` | 1 | Badge chip |
| `Target` | `lucide-react` | 1 | Feature card 3 |
| `Wallet2` | `lucide-react` | 2 | Header logo + feature card 1 |

**No custom components are defined.** Every layout structure (header, hero, summary card, pillars strip, badge chip) is inline HTML + Tailwind.

---

## 10. Technical Structure

### Main Landing Page Component
`src/pages/Index.tsx` — default export, 173 lines, single file.

### Route Registration
`src/App.tsx` line 68:
```tsx
<Route path="/" element={<Index />} />
```
**Note:** Unlike all other page components, `Index` is not lazy-loaded. It is imported statically at the top of `App.tsx` (line 16).

### Child Components
**None.** Zero sub-components extracted. All structure, layout, and content is inline.

### Assets Used
- **Imported:** Zero images.
- **Orphaned asset:** `src/assets/hero.png` exists but is never imported or referenced anywhere in the codebase.

### Animation Libraries
- **framer-motion** (v11+): two `motion.div` uses with `initial`/`animate`/`transition`
- No `AnimatePresence`, no `useScroll`, no `useInView`, no `staggerChildren`, no layout animations

### UI Libraries
- **shadcn/ui:** Button, Card (with CardHeader, CardTitle, CardContent)
- **lucide-react:** Icon set

### CSS Approach
- **Tailwind CSS exclusively** — no CSS modules, no styled-components, no CSS-in-JS beyond Tailwind
- `src/index.css` contains `@tailwind` directives, HSL custom properties, `.dark` overrides, and utility classes (`shadow-elegant`, `gradient-primary`, etc.)
- No landing-page-specific CSS file

### Tailwind Usage
- Full utility class approach — layout (`flex`, `grid`, `gap-*`), spacing (`p-*`, `py-*`, `space-y-*`, `mb-*`), typography (`text-*`, `font-*`, `tracking-*`), color (`bg-*`, `text-*`, `border-*`), sizing (`h-*`, `w-*`, `max-w-*`)
- Custom colors via `hsl(var(--<token>))` references
- Custom utilities: `shadow-elegant`, `shadow-elevated`, `shadow-glow`
- Custom animations: `fade-in`, `scale-in`, `shimmer` (unused on landing page)
- Font families: `font-sans`, `font-display`, `font-mono`

### Framer Motion Usage
```tsx
// Left column
<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

// Right column
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}>
```
- Two elements, both animate on mount (not on scroll)
- No exit animations
- No reduced-motion fallback

### State Management
**None.** The page is entirely static. No hooks, no stores, no context, no local state.

### Loading / Error / Empty States
**None.** The page has exactly one state — the default render. No loading skeleton, no error boundary content, no empty state.

### Form Elements
**None.** No inputs, no selects, no checkboxes, no textareas.

### Dependencies Used (from imports)
```
framer-motion        → motion.div
lucide-react         → ArrowRight, BarChart3, Landmark, ShieldCheck, Target, Wallet2
react-router-dom     → Link
@/components/ui/button   → Button
@/components/ui/card     → Card, CardContent, CardHeader, CardTitle
@/lib/format             → formatNaira
```

---

## Summary of Key Findings

### Critical Issues
1. **Fabricated metrics** — all numbers are invented (slop-test gate 46)
2. **No mobile navigation** — mobile users see a logo with zero navigation options
3. **No footer** — page ends abruptly with no next-step or context
4. **No social proof** — zero trust signals anywhere on the page

### Moderate Issues
5. **No imagery** — product screenshot would outperform the text-only summary card
6. **Features section has no CTA** — three cards explaining value, no way to act on them
7. **No email capture** — zero lead generation
8. **Display font unused** — `font-display` (Plus Jakarta Sans) is configured but never applied
9. **Single-file component** — 173-line inline component won't scale

### Minor Issues
10. **Orphaned asset** — `src/assets/hero.png` exists but is never used
11. **`Landmark` icon imported but never rendered** — dead code in the import
12. **No `prefers-reduced-motion` support** — animations play for all users
13. **Progress bars inaccessible** — no ARIA roles or labels
14. **Inconsistent border-radius language** — cards use `rounded-lg` (shadcn default) while hero uses `rounded-3xl`
15. **No loading state** — page assumes it always has data
