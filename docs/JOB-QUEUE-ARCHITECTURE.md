# Job Queue Architecture

## Overview

The AI Children's Book Platform uses an async job queue system for all time-consuming operations. This allows users to submit requests and navigate away while work continues in the background.

## Why Job Queues?

**Before (Synchronous):**
- User submits "Generate Story" → waits 30-60 seconds → gets result
- If user closes tab, work is lost
- Server timeout risk on slow operations
- No progress feedback
- No retry on failure

**After (Asynchronous):**
- User submits "Generate Story" → gets job ID in <1s → can navigate away
- Job processes in background
- Real-time progress updates via polling
- Automatic retry on failures
- Horizontal scaling with multiple workers

## Architecture

```
┌─────────────┐
│  User/UI    │
└──────┬──────┘
       │
       │ POST /api/books/123/generate-story
       ▼
┌─────────────────────┐
│  API Route Handler  │
│  - Validate request │
│  - Create job       │
│  - Return job ID    │
└──────┬──────────────┘
       │
       │ jobId: "abc-123"
       ▼
┌─────────────────────┐
│   Database (Jobs)   │
│  - status: pending  │
│  - progress: 0%     │
└──────┬──────────────┘
       │
       │ Poll every 2s: GET /api/jobs/abc-123
       ▼
┌─────────────────────┐     ┌──────────────┐
│   UI (Polling)      │────▶│  Job Worker  │
│  - Show progress    │     │  - Process   │
│  - Update bar       │     │  - Update DB │
└─────────────────────┘     └──────────────┘
       │
       │ status: completed
       ▼
┌─────────────────────┐
│   Result Display    │
│  - Show pages       │
│  - Download links   │
└─────────────────────┘
```

## Database Schema

### Jobs Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,                    -- 'story_generation', 'image_generation', etc.
  status TEXT DEFAULT 'pending',         -- 'pending', 'processing', 'completed', 'failed'
  
  -- Related entities
  related_id UUID,                       -- book_id, page_id, etc.
  related_type TEXT,                     -- 'book', 'page', etc.
  
  -- Job data
  input_data JSONB,                      -- Job inputs
  output_data JSONB,                     -- Intermediate outputs
  result_data JSONB,                     -- Final result
  
  -- Progress tracking
  progress_percent INTEGER DEFAULT 0,    -- 0-100
  progress_step TEXT,                    -- "Generating story..."
  
  -- Error handling
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  
  -- Idempotency
  idempotency_key TEXT UNIQUE,          -- Prevent duplicates
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Indexes

```sql
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX idx_jobs_idempotency_key ON jobs(idempotency_key);
CREATE INDEX idx_jobs_type_status ON jobs(type, status);
```

## Job Types

| Type | Description | Duration |
|------|-------------|----------|
| `story_generation` | Generate story pages with Claude | 30-60s |
| `image_generation` | Generate images for all pages | 2-5min/page |
| `pdf_export` | Generate PDF from book | 10-30s |
| `audio_export` | Generate MP3 narration | 1-2min |
| `audiobook_export` | Generate M4B audiobook | 2-3min |
| `page_regeneration` | Regenerate single page image | 30-60s |
| `character_extraction` | Extract characters from story | 10-20s |

## Job Lifecycle

```
         ┌─────────┐
         │ pending │  Created when user submits request
         └────┬────┘
              │
              │ Worker picks up job
              ▼
       ┌──────────────┐
       │  processing  │  Job is being executed
       └──────┬───────┘
              │
         ┌────┴────┐
         │         │
    ┌────▼───┐ ┌──▼──────┐
    │complete│ │ failed  │
    └────────┘ └────┬────┘
                    │
                    │ If attempts < max_attempts
                    ▼
               ┌─────────┐
               │ pending │  Retry with backoff
               └─────────┘
```

## Retry Logic

**Exponential Backoff:**
- Attempt 1: Immediate
- Attempt 2: Wait 1 minute (2^1 * 60s)
- Attempt 3: Wait 2 minutes (2^2 * 60s)
- Attempt 4+: Wait 4 minutes (2^3 * 60s)

**Max Attempts:** 3 (configurable per job type)

```typescript
function shouldRetryJob(job: Job): boolean {
  if (!job.last_attempt_at) return true
  
  const lastAttempt = new Date(job.last_attempt_at).getTime()
  const now = Date.now()
  const timeSinceLastAttempt = now - lastAttempt
  
  // Exponential backoff: 1min, 2min, 4min
  const backoffMs = Math.pow(2, job.attempts) * 60 * 1000
  
  return timeSinceLastAttempt >= backoffMs
}
```

## Idempotency

**Problem:** User clicks "Generate Story" twice → creates 2 jobs  
**Solution:** Idempotency keys

```typescript
const idempotencyKey = generateIdempotencyKey(userId, 'story_generation', bookId)
// Result: "user-123:story_generation:book-456:1646150400000"

// Check for existing job
const existingJob = await getJobByIdempotencyKey(idempotencyKey)
if (existingJob) {
  return existingJob // Return existing job instead of creating new one
}

// Create new job
await createJob({ ..., idempotencyKey })
```

## Progress Tracking

Jobs report progress in two ways:

1. **Percentage (0-100%):** Numeric progress
2. **Step (string):** Human-readable description

Example for story generation:
```typescript
0%   → "Starting..."
10%  → "Generating story with AI..."
70%  → "Saving pages..."
100% → "Complete"
```

Example for image generation:
```typescript
5%   → "Generating 10 images..."
15%  → "Generating image 1 of 10..."
25%  → "Generating image 2 of 10..."
...
95%  → "Generating image 10 of 10..."
100% → "Complete"
```

## Worker Implementation

### Single Worker (Current)

```typescript
// Trigger manually or via cron
POST /api/jobs/worker

// Worker logic
export async function processAllPendingJobs(limit = 10) {
  const pendingJobs = await getPendingJobs(limit)
  
  for (const job of pendingJobs) {
    if (!shouldRetryJob(job)) continue
    
    await processJob(job)
  }
}
```

### Job Processing

```typescript
async function processJob(job: Job) {
  // Mark as processing
  await updateJob(job.id, { 
    status: 'processing',
    progress_percent: 0 
  })
  
  try {
    // Route to appropriate handler
    switch (job.type) {
      case 'story_generation':
        await processStoryGeneration(job)
        break
      // ... other types
    }
    
    // Mark as completed
    await updateJob(job.id, { 
      status: 'completed',
      progress_percent: 100 
    })
  } catch (error) {
    // Handle failure with retry logic
    await failJob(job.id, error.message)
  }
}
```

## UI Integration

### React Hook: useJobStatus

```typescript
const { job, loading, isComplete, isFailed } = useJobStatus({
  jobId,
  pollInterval: 2000, // Poll every 2 seconds
  onComplete: (job) => {
    console.log('Job done!', job.result_data)
  },
})
```

**Features:**
- Automatic polling at configurable interval
- Stops polling when job reaches terminal state (completed/failed)
- Callbacks for completion/failure
- Returns job data, loading state, helper booleans

### Component: JobProgress

```tsx
<JobProgress
  jobId={jobId}
  onComplete={() => router.refresh()}
  onError={(err) => console.error(err)}
/>
```

**Features:**
- Visual progress bar (0-100%)
- Status icons (pending, processing, complete, failed)
- Error message display
- Step description
- Job type badge

## Deployment Options

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/jobs/worker",
    "schedule": "* * * * *"
  }]
}
```

**Pros:**
- Native Vercel integration
- No external service needed
- Free tier included

**Cons:**
- Limited to 1-minute intervals
- Only available on Vercel

### Option 2: External Cron Service

Use Render, Railway, or cron-job.org:
```bash
# Every minute
*/1 * * * * curl -X POST https://your-app.com/api/jobs/worker \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Pros:**
- Platform-agnostic
- More flexible scheduling

**Cons:**
- Requires external service
- Additional configuration

### Option 3: Self-Hosted Worker

Run dedicated worker process:
```typescript
// worker.ts
async function workerLoop() {
  while (true) {
    await processAllPendingJobs(10)
    await sleep(5000) // 5 second interval
  }
}

workerLoop()
```

**Pros:**
- Full control
- Can process multiple jobs in parallel
- Faster response times

**Cons:**
- Requires separate deployment
- More infrastructure

## Monitoring & Observability

### Key Metrics

1. **Job Success Rate**
   ```sql
   SELECT 
     type,
     COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
   FROM jobs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY type;
   ```

2. **Average Processing Time**
   ```sql
   SELECT 
     type,
     AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
   FROM jobs
   WHERE status = 'completed'
   AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY type;
   ```

3. **Failed Jobs**
   ```sql
   SELECT * FROM jobs 
   WHERE status = 'failed' 
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

4. **Stuck Jobs** (processing >10 min)
   ```sql
   SELECT * FROM jobs 
   WHERE status = 'processing'
   AND updated_at < NOW() - INTERVAL '10 minutes';
   ```

### Alerts

Set up alerts for:
- Job failure rate >10%
- Jobs stuck in processing >10 minutes
- Queue backlog >100 pending jobs
- Worker not processing (no updates in 5 minutes)

## Best Practices

1. **Always use idempotency keys** for user-initiated actions
2. **Set appropriate max_attempts** (fast jobs: 3, expensive jobs: 1)
3. **Update progress frequently** (every 10% or major milestone)
4. **Clean up old jobs** (run cleanup daily via cron)
5. **Monitor worker health** (set up dead letter queue)
6. **Log job failures** (send to error tracking service)
7. **Test retry logic** (simulate failures in staging)

## Troubleshooting

### Jobs stuck in pending
**Cause:** Worker not running  
**Fix:** Trigger worker manually or check cron setup

### Jobs fail immediately
**Cause:** Missing API keys or configuration  
**Fix:** Check environment variables

### Progress not updating
**Cause:** Polling not working  
**Fix:** Check browser console for fetch errors

### Duplicate jobs created
**Cause:** Missing idempotency key  
**Fix:** Add idempotency key to job creation

### Jobs never complete
**Cause:** Worker crashes or job logic error  
**Fix:** Check worker logs, add error handling

## Future Enhancements

- [ ] WebSocket support (push instead of poll)
- [ ] Job priority queue (urgent jobs first)
- [ ] Job dependencies (run B after A completes)
- [ ] Job scheduling (run at specific time)
- [ ] Job cancellation (cancel in-progress jobs)
- [ ] Multi-worker coordination (distributed locks)
- [ ] Dead letter queue (permanently failed jobs)
- [ ] Job analytics dashboard
- [ ] Cost tracking per job type

## Resources

- Implementation: `lib/services/job-queue.ts`, `lib/services/job-worker.ts`
- API: `app/api/jobs/`
- Components: `components/JobProgress.tsx`, `lib/hooks/useJobStatus.ts`
- Migration: `supabase/migrations/20260302150000_enhance_jobs_table.sql`
- Docs: `SESSION-7-COMPLETE.md`, `SESSION-7-QUICKSTART.md`
