# AI Children's Book Platform — Technology Stack

## Frontend

**Framework: Next.js 16.1.6 (App Router)**
- Why: Modern React framework with SSR, API routes, file-based routing
- Server components for performance
- App Router for nested layouts and streaming

**UI: React 19 + Tailwind CSS 4.2**
- Why: Component-based UI with utility-first styling
- Tailwind for rapid UI development and consistency
- Lucide React for icons

**TypeScript 5.9**
- Why: Type safety, better DX, catches errors at compile time
- Strict mode enabled for maximum safety

---

## Backend

**API: Next.js API Routes**
- Why: Co-located with frontend, no separate backend needed
- Serverless by default on Vercel
- Easy to deploy and scale

**Database: Supabase (PostgreSQL)**
- Why: Open-source Firebase alternative
- Built on PostgreSQL (battle-tested, powerful)
- Row Level Security (RLS) for auth
- Real-time subscriptions
- Easy local development with CLI

**Authentication: Supabase Auth**
- Why: Built into Supabase, handles email/password
- Secure JWT tokens
- Row Level Security integration
- Magic links, OAuth support ready

---

## AI Services

**Story Generation: Anthropic Claude 3.5 Sonnet**
- Why: Best-in-class for creative writing
- Excellent at age-appropriate content
- Structured JSON output for storyboards
- Cost: ~$0.01-0.03 per book

**Image Generation: Replicate FLUX**
- Why: State-of-the-art quality for illustrations
- FLUX schnell: 2-3 seconds per image ($0.003/image)
- FLUX dev: Better quality for character consistency
- Handles children's book aesthetic well

**Character Analysis: Claude 3.5 Sonnet (Vision)**
- Why: Extracts detailed character descriptions from images
- Creates "character bible" for consistency
- Understands visual elements (colors, clothing, features)

**Audio Narration: ElevenLabs**
- Why: Most natural-sounding TTS available
- Multiple voices (warm, energetic, soft, confident)
- High-quality output for audiobooks
- Cost: ~$0.60 per 12-page book

---

## Storage

**Images & Exports: Cloudflare R2**
- Why: S3-compatible, but cheaper egress
- Fast global CDN
- $0.015/GB storage (cheaper than S3)
- No egress fees (huge savings)
- Alternative: AWS S3 works too (same API)

**Database Storage: Supabase Storage**
- Why: Built into Supabase
- Row Level Security
- CDN included

---

## Job Queue

**Custom Job Queue (PostgreSQL-backed)**
- Why: No external services needed
- Uses existing Supabase database
- Idempotency keys
- Retry logic with exponential backoff
- Progress tracking
- Vercel Cron triggers worker every minute

**Alternative considered:** BullMQ/Redis
- Why not: Extra infrastructure, cost, complexity
- Custom solution is simpler for MVP

---

## Development Tools

**Package Manager: npm**
- Standard, reliable, works everywhere

**Code Quality: ESLint**
- Next.js config with TypeScript rules
- Catches common errors

**Database Migrations: Supabase CLI**
- Version-controlled schema changes
- Easy rollback
- Local development support

---

## Deployment

**Hosting: Vercel**
- Why: Built for Next.js (same company)
- Automatic deployments from Git
- Serverless functions
- Edge network (fast globally)
- Cron jobs for background workers
- Free hobby tier

**CI/CD: Vercel Git Integration**
- Push to main → automatic deployment
- Preview deployments for PRs
- Zero config needed

---

## Cost Breakdown (Per Book)

| Service | Usage | Cost |
|---------|-------|------|
| Story Generation | 1 call | $0.01-0.03 |
| Image Generation | 10 images | $0.03 |
| Character Analysis | 1 call | $0.01 |
| Audio Narration | 12 pages | $0.60 |
| PDF Generation | 1 file | FREE |
| Storage (R2) | 50MB/book | $0.001/mo |
| Database | Queries | FREE (hobby tier) |
| **TOTAL PER BOOK** | | **~$0.65-0.67** |

**Monthly Fixed Costs:**
- Vercel: $0 (hobby) or $20 (pro)
- Supabase: $0 (hobby) or $25 (pro)
- R2: $5/month minimum

---

## Why These Choices?

**Modern Stack:**
- Next.js 16: Latest features, great DX
- React 19: Concurrent features, better performance
- TypeScript: Type safety = fewer bugs

**AI-First:**
- Claude: Best creative writing
- FLUX: Best image quality
- ElevenLabs: Best voice quality

**Cost-Effective:**
- R2 over S3 (saves on egress)
- Custom job queue (no Redis costs)
- Supabase free tier goes far

**Developer Experience:**
- Everything in one repo
- Local development easy (supabase start)
- TypeScript catches errors early
- Fast iteration cycle

**Production-Ready:**
- Async job processing
- Retry logic
- Error handling
- Progress tracking
- Idempotency

---

## What Could Be Swapped?

**Flexible:**
- R2 ↔ AWS S3 (same API)
- Supabase ↔ PostgreSQL + Auth service
- Vercel ↔ Netlify/Railway
- Claude ↔ GPT-4 (story gen)
- FLUX ↔ Midjourney API (images)

**Locked:**
- Next.js + React (core architecture)
- PostgreSQL (schema depends on it)
- Job queue (PostgreSQL-backed)

---

**Bottom Line:** Modern, AI-first stack optimized for speed, quality, and cost. Everything chosen for production readiness and developer experience.
