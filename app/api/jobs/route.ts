import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserJobs } from '@/lib/services/job-queue'

/**
 * GET /api/jobs
 * Get user's jobs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as any
    const status = searchParams.get('status') as any
    const relatedId = searchParams.get('relatedId') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get jobs
    const jobs = await getUserJobs(user.id, {
      type,
      status,
      relatedId,
      limit,
    }, supabase)

    return NextResponse.json({
      jobs,
      count: jobs.length,
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
