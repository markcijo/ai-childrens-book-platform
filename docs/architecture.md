# Architecture (MVP → V2)

## High-level
- **Web App (Next.js)**: wizard UI, review, exports
- **API**: create projects/books, request generations, fetch artifacts
- **Orchestrator/Workers** (queue): model calls + retries + metering
- **Storage**: S3/R2 for images/audio/PDF
- **DB (Postgres)**: metadata + job tracking + billing ledger

## Key services/modules

### 1) Story service
Input: idea + constraints (age, moral, length)
Output: story + storyboard with scene descriptions.

### 2) Character service
Input: character descriptions + style preset
Output: character bible artifacts:
- canonical portraits
- palette
- prompt tokens
- training dataset (synthetic images)
- **consistency asset**: LoRA id or reference pack id

### 3) Illustration service
Input: page scene description + characters + style + consistency asset
Output: page image + metadata.

### 4) Layout/Render service
Input: pages (text + images) + template
Output: PDF (and later ePub).

### 5) Narration service
Input: full script (or per-page), voice selection
Output: audio files + timing.

### 6) Moderation service
- Pre-moderate user prompts
- Post-check outputs
- Flag + block sharing/export when policy violated

## Data model (sketch)
- users
- projects
- characters
- character_assets (lora/reference packs)
- books
- pages
- artifacts (image/audio/pdf)
- jobs (type, status, attempts, logs)
- ledger_entries (credits consumed, provider cost estimates)

## Job queue
Job types:
- STORYBOARD_GENERATE
- CHARACTER_SHEET_GENERATE
- LORA_TRAIN
- PAGE_IMAGE_GENERATE
- PAGE_IMAGE_REGENERATE
- NARRATION_GENERATE
- PDF_RENDER

Queue requirements:
- idempotency keys
- exponential backoff
- provider timeouts
- cancellation

## Providers (pluggable adapters)
- LLM: OpenAI/Anthropic (abstract)
- Images: Flux/SDXL (hosted), Midjourney (if TOS allows automation)
- Video (premium): Kling
- TTS: ElevenLabs

## Observability
- Job logs + provider response capture (redacted)
- Cost tracking per job
- Quality metrics: regen count, user edits

## Security & privacy
- Minimize PII; store only what’s needed.
- Encrypt at rest (managed DB + storage).
- Treat as child-directed: conservative moderation.

