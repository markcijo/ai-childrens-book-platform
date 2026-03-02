# AI Children’s Book Platform — Agent Notes (CLAUDE.md)

## Product goal
Create an end-to-end platform where parents/educators can go from **story idea → consistent characters → illustrated book → narrated audiobook** (and optionally animated video).

Core differentiator: **character consistency** across pages and across series.

## MVP scope (first shippable)
- Guided story input (idea, age band, themes, moral, length)
- Story generation + storyboard (page-by-page text)
- Character bible creation (2–4 characters + style preset)
- Consistent illustrations per page (Flux/SDXL + LoRA or reference-conditioning)
- Layout templates → export **PDF** (print-ready)
- ElevenLabs narration → **MP3/M4B**

Defer: full 4K/60 video (Kling) until costs + latency are proven.

## Non-goals
- Collecting child biometric data (face/voice) in MVP.
- Open social network for kids.

## Key risks to manage
- Output safety (kid-appropriate content)
- Character drift (QC + regen loops)
- Cost overruns (credits + tiering)
- IP/copyright positioning

## Architecture principles
- **Orchestrate everything via jobs/queues** (image gen, LoRA training, narration, layout).
- **Deterministic artifacts**: versioned prompts, seeds, model versions per project/book.
- **Auditability**: store generation metadata; allow regen per page.
- **Safety-first**: moderation gates before/after generation.

## Suggested stack (default)
- Web app: Next.js (App Router) + Tailwind
- API: Next.js route handlers or FastAPI service (if heavy)
- DB: Postgres (Supabase/Neon)
- Queue: BullMQ/Redis or Cloud Tasks
- Storage: S3-compatible (R2/S3)
- Auth: Clerk/Supabase Auth

## Key domain objects
- User
- Project (a “universe”)
- Character (bible + LoRA refs)
- Book (storyboard + pages)
- Page (text + image + layout)
- Narration (voice, script, audio)
- Render (PDF/ePub/video)
- Job (status, cost, logs)

## Repo conventions
- Keep architecture docs in `/docs`
- Keep research notes in `/research`
- Track build plan in `/todo.md`

## How to work in this repo
When implementing features:
1. Update `/todo.md` with the next 3–10 concrete tasks.
2. Add/adjust docs in `/docs` (API contracts, queues, data model).
3. Build minimal vertical slices (create project → generate 1 page → export).

