import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJob, generateIdempotencyKey } from '@/lib/services/job-queue'
import { validateReplicateConfig } from '@/lib/services/image-generator'

type RouteParams = {
  params: Promise<{
    id: string
    pageId: string
  }>
}

/**
 * POST /api/books/[id]/pages/[pageId]/regenerate
 * Create an async job to regenerate a page image
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: bookId, pageId } = await params

    // Validate Replicate configuration
    const configCheck = validateReplicateConfig()
    if (!configCheck.configured) {
      return NextResponse.json(
        { error: configCheck.error },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify page exists and belongs to user's book
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*, books!inner(user_id)')
      .eq('id', pageId)
      .eq('book_id', bookId)
      .single()

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    if (page.books.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your book' },
        { status: 403 }
      )
    }

    if (!page.image_prompt) {
      return NextResponse.json(
        { error: 'Page has no image prompt' },
        { status: 400 }
      )
    }

    // Create job with idempotency key
    const idempotencyKey = generateIdempotencyKey(user.id, 'page_regeneration', pageId)
    
    const job = await createJob({
      userId: user.id,
      type: 'page_regeneration',
      relatedId: pageId,
      relatedType: 'page',
      inputData: {
        pageId,
        bookId,
        userId: user.id,
      },
      idempotencyKey,
      maxAttempts: 3,
    }, supabase)

    return NextResponse.json({
      success: true,
      message: 'Page regeneration job created',
      jobId: job.id,
      status: job.status,
    })
  } catch (error) {
    console.error('Page regeneration job creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create page regeneration job' },
      { status: 500 }
    )
  }
}
