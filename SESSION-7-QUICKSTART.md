# Session 7 Quickstart: Job Queue System

## Quick Setup

### 1. Apply Database Migration
```bash
# Start Supabase (if not running)
npx supabase start

# Apply migrations
npx supabase db reset --local

# Or push to remote
npx supabase db push
```

### 2. Install Dependencies
```bash
npm install lucide-react
```

### 3. Start Development Server
```bash
npm run dev
```

## How It Works (2-Minute Overview)

### User Flow
1. User clicks "Generate Story" button
2. API creates job in database (returns job ID in <1s)
3. UI starts polling job status every 2 seconds
4. Background worker processes the job
5. Progress bar updates in real-time (0% → 10% → 70% → 100%)
6. On completion, UI refreshes to show results

### Worker Flow
Worker can be triggered:
- **Development:** Manual API call
- **Production:** Vercel Cron or external cron service

```bash
# Trigger worker manually (processes up to 10 pending jobs)
curl -X POST http://localhost:3000/api/jobs/worker
```

## Testing the System

### Test Story Generation
1. Create a book via UI
2. Click "Generate Story"
3. See JobProgress component with:
   - ⏳ "Queued" → 🔄 "Processing" → ✅ "Complete"
   - Progress bar: 0% → 10% → 70% → 100%
   - Step: "Starting..." → "Generating story with AI..." → "Saving pages..."

### Test Background Processing
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Trigger worker (processes jobs)
while true; do
  curl -X POST http://localhost:3000/api/jobs/worker
  sleep 5
done
```

### Test API Endpoints

**Create a job:**
```bash
# Generate story
curl -X POST http://localhost:3000/api/books/{bookId}/generate-story \
  -H "Cookie: your-session-cookie"
# Returns: { "jobId": "...", "status": "pending" }
```

**Poll job status:**
```bash
curl http://localhost:3000/api/jobs/{jobId} \
  -H "Cookie: your-session-cookie"
# Returns: { "job": { "id": "...", "status": "processing", "progress_percent": 42, ... } }
```

**List user's jobs:**
```bash
curl http://localhost:3000/api/jobs?status=processing \
  -H "Cookie: your-session-cookie"
```

## Component Usage

### JobProgress Component
```tsx
import { JobProgress } from '@/components/JobProgress'

function MyComponent() {
  const [jobId, setJobId] = useState<string | null>(null)

  const handleStartJob = async () => {
    const res = await fetch('/api/books/123/generate-story', { method: 'POST' })
    const data = await res.json()
    setJobId(data.jobId)
  }

  return (
    <div>
      {jobId ? (
        <JobProgress
          jobId={jobId}
          onComplete={() => {
            console.log('Job done!')
            setJobId(null)
          }}
          onError={(err) => console.error(err)}
        />
      ) : (
        <button onClick={handleStartJob}>Start</button>
      )}
    </div>
  )
}
```

### useJobStatus Hook
```tsx
import { useJobStatus } from '@/lib/hooks/useJobStatus'

function MyComponent({ jobId }: { jobId: string }) {
  const { job, loading, error, isComplete, refresh } = useJobStatus({
    jobId,
    pollInterval: 2000, // Poll every 2 seconds
    onComplete: (job) => {
      console.log('Completed!', job.result_data)
    },
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <p>Status: {job?.status}</p>
      <p>Progress: {job?.progress_percent}%</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

## Production Deployment

### Option 1: Vercel Cron (Recommended for Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/jobs/worker",
    "schedule": "* * * * *"
  }]
}
```

Deploy:
```bash
vercel deploy --prod
```

### Option 2: External Cron Service
Use Render, Railway, or any service with cron:
```bash
# Add to crontab or cron service:
*/1 * * * * curl -X POST https://your-app.com/api/jobs/worker \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Set environment variable:
```bash
CRON_SECRET=your-secret-token
```

### Option 3: Upstash QStash (Serverless Cron)
```bash
# Install Upstash QStash
npm install @upstash/qstash

# Schedule via dashboard or API
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -d '{"destination": "https://your-app.com/api/jobs/worker", "cron": "* * * * *"}'
```

## Common Issues

### Jobs stuck in "pending"
**Problem:** Worker not running  
**Solution:** Trigger worker manually or set up cron

```bash
curl -X POST http://localhost:3000/api/jobs/worker
```

### Jobs fail immediately
**Problem:** Missing API keys or configuration  
**Solution:** Check .env.local

```bash
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...
ELEVENLABS_API_KEY=...
```

### Progress not updating
**Problem:** Polling not working  
**Solution:** Check browser console for fetch errors

### Duplicate jobs created
**Problem:** Idempotency key collision  
**Solution:** This is by design! Same request = same job

## Database Queries (Useful for Debugging)

```sql
-- View all jobs
SELECT id, type, status, progress_percent, created_at 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- View pending jobs
SELECT * FROM jobs WHERE status = 'pending';

-- View failed jobs
SELECT * FROM jobs WHERE status = 'failed';

-- Manually retry a job
UPDATE jobs SET status = 'pending', attempts = 0 WHERE id = '...';

-- Clean up old jobs
SELECT cleanup_old_jobs();

-- View job with details
SELECT * FROM jobs WHERE id = 'your-job-id';
```

## Performance Tips

### Reduce Polling Frequency
```tsx
useJobStatus({
  jobId,
  pollInterval: 5000, // Poll every 5 seconds instead of 2
})
```

### Process Multiple Jobs at Once
```bash
# Process up to 50 jobs
curl -X POST "http://localhost:3000/api/jobs/worker?limit=50"
```

### Monitor Worker Performance
```typescript
// In job-worker.ts
console.time('job-processing')
await processJob(job)
console.timeEnd('job-processing')
```

## Next Steps

1. ✅ Test job creation via UI
2. ✅ Verify worker processes jobs
3. ✅ Check progress updates in real-time
4. ✅ Set up production cron
5. ✅ Monitor for errors in production

## Support

If you encounter issues:
1. Check `SESSION-7-COMPLETE.md` for full documentation
2. Review API routes in `app/api/jobs/`
3. Check database migrations in `supabase/migrations/`
4. Test with manual worker trigger first

## Cheat Sheet

```bash
# Create job
POST /api/books/{id}/generate-story

# Poll status
GET /api/jobs/{jobId}

# List jobs
GET /api/jobs?status=pending

# Trigger worker
POST /api/jobs/worker

# Build & test
npm run build
npm run dev
```

That's it! Your job queue system is ready to go. 🚀
