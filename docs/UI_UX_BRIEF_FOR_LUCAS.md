# UI/UX Design Brief (For Lucas) — AI Children’s Book Platform

## Goal
App is functionally complete but visually unpolished. We must **pause UI implementation**, and complete **full UI/UX + copy design first** (Figma + specs), then Ethan implements.

## Tech constraints (so designs are implementable)
- Next.js App Router (`app/`)
- Tailwind CSS
- Components are currently plain Tailwind (no established design system yet)
- Auth + DB: Supabase

## Current IA (routes that exist today)
### Marketing / public
- `/` — Landing page (hero, features, how it works, pricing, demo, CTA, footer)
- `/login` — Login form
- `/signup` — Signup form

### App / authenticated
- `/dashboard` — Project list + “Create Project” form + top nav
- `/projects/[id]` — Project detail + list of books + “Create Book” modal/wizard
- `/books/[id]` — Book detail (status, generation CTAs, characters, storyboard pages, export)

## Key product flows to design
### 1) Visitor → Signup → Dashboard
- Landing page CTA(s) → signup
- Signup success redirects to dashboard
- Login for returning users

### 2) Dashboard → Create Project
- Right-rail card with form (name + description)
- Empty state vs populated state

### 3) Project → Create Book (Wizard modal)
Current wizard is 3 steps:
1. Story idea (textarea, 0–500 chars)
2. Settings (title, age range, genre, page count 4–24)
3. Review + create

Design needs:
- Modal experience (mobile + desktop)
- Stepper/progress indicator
- Validation/error patterns (currently `alert()`)

### 4) Book lifecycle UI
Book statuses used in UI:
- `draft` → show “Generate Story” CTA
- `generating` → spinner/progress state
- `complete` → show “Generate Images”, “Extract Characters”, “Export”, plus storyboard
- `generating_images` → show “Generating Images…” plus storyboard updating
- Also present in code: `partial`, `error`, `published` (need designs for these states too)

### 5) Storyboard / pages UI
Storyboard page card currently shows:
- scene description
- narration text
- image prompt (monospace)
- generated illustration (or placeholder)
- per-page regenerate button

Design needs:
- Improve readability + hierarchy
- Responsive layout
- Clear per-page status + retry/error patterns

### 6) Export
Export buttons exist (PDF + audio). Needs polished placement + messaging.

## Deliverables required from Lucas (must-have)
1. **Figma file** covering:
   - Landing page (hero, social proof optional, features, how-it-works, pricing, demo/example, FAQs optional, final CTA, footer)
   - Auth pages (login/signup)
   - App shell layout: top nav, side nav (if you choose), content container, page headers
   - Dashboard layout (projects list + create project)
   - Project detail page (books grid/list, empty state, create book primary action)
   - Create book wizard (modal + full-page variant if preferred)
   - Book detail page (status cards, actions, characters, storyboard)
   - Form elements (inputs, selects, textarea), validation states, toasts
   - Loading/empty/error states (global + per-module)

2. **Component specs** (at least):
   - Buttons (primary/secondary/ghost/destructive), sizes, states
   - Inputs/selects/textarea, labels/help text, error states
   - Cards, modals, steppers, badges/status pills
   - Tables/lists, empty states
   - Typography scale + spacing scale

3. **Design system doc**
- Color palette (brand + neutrals + semantic)
- Typography (font choices, weights)
- Spacing/radius/shadows
- Icon usage guidelines

4. **Copy**
- Landing page: sharp value prop, feature blurbs, pricing copy, CTA copy
- In-app microcopy: empty states, button labels, helper text, generation status messages

## Notes / current rough copy (to rewrite)
Landing page currently claims:
- “Create Professional Children’s Books with AI in Minutes”
- “Professional PDF + Audiobook • 2-3 minutes • Starting at $0.65/book”
- Pricing shown as `$1.99/book` and `$29/month` (needs consistency/decision)

## Hand-off expectations (so Ethan can implement fast)
- Provide spacing + layout measurements (8pt grid preferred)
- Provide component variants and examples
- Identify what should be reusable components vs page-specific
- Include mobile breakpoints for every page

## Success criteria
- Looks professional and cohesive end-to-end
- Clear, confidence-building landing page
- Minimal friction in create-project/create-book flows
- Strong hierarchy in book detail + storyboard
- Consistent components + states
