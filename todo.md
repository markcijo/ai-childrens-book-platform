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

### Session 1-3 (Complete ✅)
- [x] Next.js app: auth, project create, book wizard
- [x] Story generation service (Anthropic Claude integration)
- [x] Generate story API endpoint
- [x] Storyboard UI (display pages with scene descriptions)
- [x] Age-appropriate content system (3-5, 6-8, 9-12, 13+)

### Session 4 (Complete ✅)
- [x] Image generation service (Replicate FLUX schnell)
- [x] Generate images API endpoint
- [x] Generate Images button in UI
- [x] Display generated images in storyboard
- [x] Store image URLs in database
- [x] Error handling for failed generations
- [x] Loading states and progress tracking

### Session 5 (Complete ✅)
- [x] Character bible creation (extract from story)
- [x] Character consistency (img2img reference-conditioning)
- [x] S3/R2 permanent image storage
- [x] Upload generated images to S3/R2
- [x] Page regeneration controls
- [x] Character extraction UI
- [x] Character display (Character Bible)
- [x] Automatic character extraction after first page

### Session 6 (Complete ✅)
- [x] Layout: 3 templates + PDF render
- [x] Audio: narration generation + download (ElevenLabs)
- [x] Export: PDF, MP3, M4B download buttons
- [x] Book export UI with progress indicators

### Session 7 (Complete ✅)
- [x] Job queue design + idempotency keys
- [x] Enhanced jobs table schema (progress, retry, metadata)
- [x] Job queue service (create, update, poll status)
- [x] Job worker service (process all job types)
- [x] Convert story generation to async job
- [x] Convert image generation to async job
- [x] Convert exports (PDF, audio) to async jobs
- [x] Job status API endpoint (poll job status)
- [x] UI updates for async job tracking (JobProgress component)
- [x] useJobStatus hook for polling
- [x] Idempotency keys prevent duplicate jobs
- [x] Retry logic with exponential backoff
- [x] All TypeScript strict mode passing
- [x] npm run build works clean

### Session 8+ (Future)
- [ ] Upload PDFs/audio to R2/S3 (permanent storage)
- [ ] Admin: job logs + cost dashboard
- [ ] Webhook support (alternative to polling)

## P2 — Premium features
- [ ] Chapter clip animation (1080p) via Kling (credit-gated)
- [ ] Series engine: reuse characters/worlds across books
- [ ] Educator mode: vocabulary targets + discussion questions

