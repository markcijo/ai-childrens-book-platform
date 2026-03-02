# Job Queue Quick Reference Card

## Common Operations

### Create a Job
```typescript
import { createJob, generateIdempotencyKey } from '@/lib/services/job-queue'

const job = await createJob({
  userId: user.id,
  type: 'story_generation',
  relatedId: bookId,
  relatedType: 'book',
  inputData: { title, storyIdea, ageRange },
  idempotencyKey: generateIdempotencyKey(user.id, 'story_generation', bookId),
  maxAttempts: 3,
})
```

### Update Job Progress
```typescript
import { updateJob } from '@/lib/services/job-queue'

await updateJob(jobId, {
  progressPercent: 50,
  progressStep: 'Generating images...',
})
```

### Mark Job Complete
```typescript
await updateJob(jobId, {
  status: 'completed',
  progressPercent: 100,
  resultData: { pdfUrl: 'https://...' },
})
```

### Mark Job Failed
```typescript
import { failJob } from '@/lib/services/job-queue'

await failJob(jobId, 'API key invalid')
// Automatically retries if attempts < max_attempts
```

### Get Job Status
```typescript
import { getJob } from '@/lib/services/job-queue'

const job = await getJob(jobId)
console.log(job.status, job.progress_percent)
```

### Query User's Jobs
```typescript
import { getUserJobs } from '@/lib/services/job-queue'

const jobs = await getUserJobs(userId, {
  type: 'image_generation',
  status: 'processing',
  limit: 10,
})
```

## React Components

### Use JobProgress Component
```tsx
import { JobProgress } from '@/components/JobProgress'

function MyComponent() {
  const [jobId, setJobId] = useState<string | null>(null)

  return jobId ? (
    <JobProgress
      jobId={jobId}
      onComplete={() => router.refresh()}
      onError={(err) => alert(err)}
    />
  ) : (
    <button onClick={createJob}>Start</button>
  )
}
```

### Use useJobStatus Hook
```tsx
import { useJobStatus } from '@/lib/hooks/useJobStatus'

function MyComponent({ jobId }: { jobId: string }) {
  const { job, loading, isComplete, refresh } = useJobStatus({
    jobId,
    pollInterval: 2000,
    onComplete: (job) => console.log('Done!', job.result_data),
  })

  return (
    <div>
      <p>Status: {job?.status}</p>
      <p>Progress: {job?.progress_percent}%</p>
      <p>Step: {job?.progress_step}</p>
      {isComplete && <p>Result: {JSON.stringify(job?.result_data)}</p>}
    </div>
  )
}
```

## API Endpoints

### Create Job (Example: Generate Story)
```bash
POST /api/books/123/generate-story
→ { "jobId": "abc-123", "status": "pending" }
```

### Get Job Status
```bash
GET /api/jobs/abc-123
→ { 
    "job": { 
      "id": "abc-123", 
      "status": "processing", 
      "progress_percent": 42,
      "progress_step": "Generating page 3 of 10..."
    } 
  }
```

### List User's Jobs
```bash
GET /api/jobs?status=processing&limit=10
→ { "jobs": [...], "count": 5 }
```

### Trigger Worker
```bash
POST /api/jobs/worker
→ { "success": true, "processedCount": 3 }
```

## SQL Queries

### View Recent Jobs
```sql
SELECT id, type, status, progress_percent, created_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

### View Pending Jobs
```sql
SELECT * FROM jobs WHERE status = 'pending';
```

### View Failed Jobs
```sql
SELECT * FROM jobs WHERE status = 'failed';
```

### Retry Failed Job
```sql
UPDATE jobs 
SET status = 'pending', attempts = 0 
WHERE id = 'abc-123';
```

### Clean Up Old Jobs
```sql
SELECT cleanup_old_jobs(); -- Deletes jobs >24h old
```

## Job Types Reference

| Type | Duration | Max Attempts |
|------|----------|--------------|
| `story_generation` | 30-60s | 3 |
| `image_generation` | 2-5min/page | 3 |
| `pdf_export` | 10-30s | 3 |
| `audio_export` | 1-2min | 3 |
| `audiobook_export` | 2-3min | 3 |
| `page_regeneration` | 30-60s | 3 |
| `character_extraction` | 10-20s | 3 |

## Job Status Values

| Status | Description |
|--------|-------------|
| `pending` | Job created, waiting for worker |
| `processing` | Worker is executing job |
| `completed` | Job finished successfully |
| `failed` | Job failed after max attempts |
| `cancelled` | Job cancelled by user |

## Progress Tracking Pattern

```typescript
// Job processor example
async function processMyJob(job: Job) {
  await updateJob(job.id, { 
    status: 'processing',
    progressPercent: 0,
    progressStep: 'Starting...' 
  })

  // Do work step 1
  await doWork1()
  await updateJob(job.id, { 
    progressPercent: 30,
    progressStep: 'Step 1 complete...' 
  })

  // Do work step 2
  await doWork2()
  await updateJob(job.id, { 
    progressPercent: 70,
    progressStep: 'Step 2 complete...' 
  })

  // Complete
  await updateJob(job.id, { 
    status: 'completed',
    progressPercent: 100,
    resultData: { output: 'result' }
  })
}
```

## Retry Logic

```typescript
// Automatic retry with exponential backoff
Attempt 1 → Immediate
Attempt 2 → Wait 1 minute (2^1 * 60s)
Attempt 3 → Wait 2 minutes (2^2 * 60s)
Failed → Mark as failed

// Check if job should retry
import { shouldRetryJob } from '@/lib/services/job-queue'

if (shouldRetryJob(job)) {
  await processJob(job)
}
```

## Idempotency

```typescript
// Generate idempotency key
import { generateIdempotencyKey } from '@/lib/services/job-queue'

const key = generateIdempotencyKey(userId, 'story_generation', bookId)
// Result: "user-123:story_generation:book-456:1646150400"

// Create job with idempotency
const job = await createJob({
  ...,
  idempotencyKey: key,
})

// If job with same key exists, returns existing job
// If not, creates new job
```

## Cron Setup

### Vercel Cron
```json
// vercel.json
{
  "crons": [{
    "path": "/api/jobs/worker",
    "schedule": "* * * * *"
  }]
}
```

### External Cron
```bash
# crontab -e
*/1 * * * * curl -X POST https://your-app.com/api/jobs/worker \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Manual Trigger
```bash
curl -X POST http://localhost:3000/api/jobs/worker
```

## Debugging

### Check Job Status
```typescript
const job = await getJob(jobId)
console.log({
  status: job.status,
  progress: job.progress_percent,
  attempts: job.attempts,
  error: job.error_message,
})
```

### Force Retry
```sql
UPDATE jobs SET status = 'pending', attempts = 0 WHERE id = 'abc-123';
```

### View Logs
```bash
# Worker logs
tail -f /var/log/worker.log

# Or check Vercel logs
vercel logs --follow
```

## Common Patterns

### Create + Poll Pattern
```typescript
// 1. Create job
const res = await fetch('/api/books/123/generate-story', { 
  method: 'POST' 
})
const { jobId } = await res.json()

// 2. Poll status
const { job } = useJobStatus({ 
  jobId,
  onComplete: () => router.refresh() 
})

// 3. Display progress
return <JobProgress jobId={jobId} />
```

### Background Worker Pattern
```typescript
// Worker (runs via cron)
export async function POST() {
  const jobs = await getPendingJobs(10)
  
  for (const job of jobs) {
    if (shouldRetryJob(job)) {
      await processJob(job)
    }
  }
  
  return NextResponse.json({ 
    success: true,
    processed: jobs.length 
  })
}
```

## Environment Variables

```bash
# Optional: Protect worker endpoint
CRON_SECRET=your-secret-token

# Job configuration (optional)
MAX_JOB_ATTEMPTS=3
JOB_CLEANUP_HOURS=24
WORKER_POLL_INTERVAL=5000
```

## Performance Tips

1. **Batch Updates:** Update progress every 10-20% (not every 1%)
2. **Limit Polling:** Use 2-5 second intervals (not <1s)
3. **Clean Up:** Run cleanup daily to remove old jobs
4. **Index Usage:** Ensure indexes on `status` and `created_at`
5. **Worker Concurrency:** Process multiple jobs in parallel

## Checklist for New Job Type

- [ ] Add job type to `JobType` enum
- [ ] Create processor function in `job-worker.ts`
- [ ] Add route to switch statement in `processJob()`
- [ ] Create API endpoint (returns job ID)
- [ ] Update UI component to use JobProgress
- [ ] Add progress tracking (0%, 30%, 70%, 100%)
- [ ] Add error handling
- [ ] Test with manual worker trigger
- [ ] Document in this reference

---

**Need more details?** See `docs/JOB-QUEUE-ARCHITECTURE.md` or `SESSION-7-COMPLETE.md`
