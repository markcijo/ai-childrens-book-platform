import { NextRequest, NextResponse } from 'next/server'
import { processAllPendingJobs } from '@/lib/services/job-worker'

/**
 * POST /api/jobs/worker
 * Trigger job processing (can be called by cron or manually)
 * 
 * For production, this should be protected by a secret token or run via Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log('🔄 Starting job worker...')
    const processedCount = await processAllPendingJobs(limit)

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} jobs`,
      processedCount,
    })
  } catch (error) {
    console.error('Job worker error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Job worker failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/worker
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
