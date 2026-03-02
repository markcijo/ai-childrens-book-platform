# TODO — AI Children’s Book Platform

## P0 — Product validation (this week)
- [ ] Competitive teardown: StoryWizard, BedtimeStory, Canva/Book Creator (pricing, workflows, gaps) (assign James)
- [ ] 10 user interviews plan (parents + teachers + prosumers) + screener + questions
- [ ] Define MVP deliverable: PDF + MP3/M4B (no full video), with optional motion-lite
- [ ] Decide on character consistency method for MVP (LoRA vs reference-conditioning)

## P0 — Technical spike (1–2 days)
- [ ] Prototype pipeline locally: story → storyboard → 3 pages → consistent character output
- [ ] Evaluate LoRA training time/cost using synthetic character sheet dataset
- [ ] Measure regeneration rate needed for acceptable consistency (QC loop)
- [ ] Draft moderation policy + integrate a moderation API for prompts/outputs

## P1 — System design
- [ ] Data model (User, Project, Character, Book, Page, Job, Render)
- [ ] Job queue design + idempotency keys
- [ ] Storage layout for artifacts (raw prompts, images, audio, pdf)
- [ ] Cost/credit metering model (per image, per LoRA train, per minute of TTS)

## P1 — MVP build
- [ ] Next.js app: auth, project create, book wizard
- [ ] Backend: create-book job, generate-page job, regenerate-page
- [ ] Layout: 3 templates + PDF render
- [ ] Audio: narration generation + download
- [ ] Admin: job logs + cost dashboard

## P2 — Premium features
- [ ] Chapter clip animation (1080p) via Kling (credit-gated)
- [ ] Series engine: reuse characters/worlds across books
- [ ] Educator mode: vocabulary targets + discussion questions

