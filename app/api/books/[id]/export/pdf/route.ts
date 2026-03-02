import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJob, generateIdempotencyKey } from '@/lib/services/job-queue'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/books/[id]/export/pdf
 * Create an async job to generate PDF export
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

    // Verify book ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check if book has pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id')
      .eq('book_id', bookId)

    if (pagesError || !pages || pages.length === 0) {
      return NextResponse.json(
        { error: 'Book has no pages. Generate story first.' },
        { status: 400 }
      )
    }

    // Create job with idempotency key
    const idempotencyKey = generateIdempotencyKey(user.id, 'pdf_export', bookId)
    
    const job = await createJob({
      userId: user.id,
      type: 'pdf_export',
      relatedId: bookId,
      relatedType: 'book',
      inputData: {
        bookId,
        userId: user.id,
      },
      idempotencyKey,
      maxAttempts: 3,
    }, supabase)

    return NextResponse.json({
      success: true,
      message: 'PDF export job created',
      jobId: job.id,
      status: job.status,
    })
  } catch (error) {
    console.error('PDF export job creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PDF export job' },
      { status: 500 }
    )
  }
}
