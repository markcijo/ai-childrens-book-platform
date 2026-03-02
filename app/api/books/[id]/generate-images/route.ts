import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJob, generateIdempotencyKey } from '@/lib/services/job-queue'
import { validateReplicateConfig } from '@/lib/services/image-generator'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get book ID from params
    const { id: bookId } = await context.params

    // Validate Replicate configuration
    const configCheck = validateReplicateConfig()
    if (!configCheck.configured) {
      return NextResponse.json(
        { error: configCheck.error },
        { status: 500 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify book ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, user_id, title, status')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (book.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your book' },
        { status: 403 }
      )
    }

    // Get all pages for this book that have image prompts
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, page_number, image_prompt, image_url')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })

    if (pagesError) {
      console.error('Error fetching pages:', pagesError)
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: 500 }
      )
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages found. Generate the story first.' },
        { status: 400 }
      )
    }

    // Filter pages that need images
    const pagesToGenerate = pages.filter(p => p.image_prompt && !p.image_url)

    if (pagesToGenerate.length === 0) {
      return NextResponse.json(
        { message: 'All pages already have images', pages: pages.length },
        { status: 200 }
      )
    }

    console.log(`Creating job to generate images for ${pagesToGenerate.length} pages...`)

    // Update book status to 'generating_images'
    await supabase
      .from('books')
      .update({ status: 'generating_images' })
      .eq('id', bookId)

    // Create job with idempotency key
    const idempotencyKey = generateIdempotencyKey(user.id, 'image_generation', bookId)
    
    const job = await createJob({
      userId: user.id,
      type: 'image_generation',
      relatedId: bookId,
      relatedType: 'book',
      inputData: {
        bookId,
        userId: user.id,
        pageCount: pagesToGenerate.length,
      },
      idempotencyKey,
      maxAttempts: 3,
    }, supabase)

    return NextResponse.json({
      success: true,
      message: `Image generation job created for ${pagesToGenerate.length} pages`,
      jobId: job.id,
      status: job.status,
      pageCount: pagesToGenerate.length,
    })

  } catch (error) {
    console.error('Error creating image generation job:', error)
    
    // Try to update book status to error
    try {
      const { id: bookId } = await context.params
      const supabase = await createClient()
      await supabase
        .from('books')
        .update({ status: 'error' })
        .eq('id', bookId)
    } catch (updateError) {
      console.error('Failed to update book status:', updateError)
    }

    return NextResponse.json(
      { 
        error: 'Failed to create image generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
