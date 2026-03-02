import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJob, generateIdempotencyKey } from '@/lib/services/job-queue'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/books/[id]/generate-story
 * Create an async job to generate story (returns job ID for polling)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: bookId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Validate required fields
    if (!book.story_idea || !book.title || !book.age_range || !book.genre || !book.page_count) {
      return NextResponse.json(
        { error: 'Book is missing required fields for story generation' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Story generation is not configured. Please add ANTHROPIC_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    // Update book status to generating
    await supabase
      .from('books')
      .update({ status: 'generating' })
      .eq('id', bookId)

    // Create job with idempotency key
    const idempotencyKey = generateIdempotencyKey(user.id, 'story_generation', bookId)
    
    const job = await createJob({
      userId: user.id,
      type: 'story_generation',
      relatedId: bookId,
      relatedType: 'book',
      inputData: {
        bookId,
        storyIdea: book.story_idea,
        title: book.title,
        ageRange: book.age_range,
        genre: book.genre,
        pageCount: book.page_count,
      },
      idempotencyKey,
      maxAttempts: 3,
    }, supabase)

    return NextResponse.json({
      success: true,
      message: 'Story generation job created',
      jobId: job.id,
      status: job.status,
    })
  } catch (error) {
    console.error('Story generation job creation error:', error)
    
    // Try to revert book status on error
    try {
      const { id: bookId } = await params
      const supabase = await createClient()
      await supabase
        .from('books')
        .update({ status: 'draft' })
        .eq('id', bookId)
    } catch (revertError) {
      console.error('Failed to revert book status:', revertError)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create story generation job' },
      { status: 500 }
    )
  }
}
