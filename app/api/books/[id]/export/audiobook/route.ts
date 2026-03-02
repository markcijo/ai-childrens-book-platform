/**
 * Audiobook (M4B) Export API Endpoint
 * 
 * POST /api/books/[id]/export/audiobook
 * Generates audiobook (MP3 with metadata for now, M4B planned)
 * 
 * Note: M4B conversion requires ffmpeg and will be added in a future update.
 * For now, this endpoint generates the same MP3 as the audio endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateBookNarration,
  generateAudioFilename,
  estimateNarrationCost,
  type NarrationOptions,
} from '@/lib/services/audio-narration'
import { uploadToStorage } from '@/lib/services/storage'
import type { Book, Page } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await context.params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if ElevenLabs API key is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const options: NarrationOptions = {
      voiceName: body.voiceName || 'Rachel',
      voiceId: body.voiceId,
      modelId: body.modelId || 'eleven_turbo_v2',
      stability: body.stability !== undefined ? body.stability : 0.5,
      similarityBoost: body.similarityBoost !== undefined ? body.similarityBoost : 0.75,
      silenceDuration: body.silenceDuration !== undefined ? body.silenceDuration : 1500,
    }

    // Fetch book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Fetch pages (need first page for cover image)
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })

    if (pagesError || !pages || pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages found for this book' },
        { status: 400 }
      )
    }

    // Estimate cost
    const totalText = pages.map((p: Page) => p.narration_text || p.text).join(' ')
    const estimatedCost = estimateNarrationCost(totalText)

    console.log(`Generating audiobook for book ${bookId}...`)
    console.log(`Estimated cost: $${estimatedCost.toFixed(2)}`)

    // Generate narration (MP3)
    // Note: M4B conversion will be added in future update
    const { combinedBuffer: mp3Buffer } = await generateBookNarration(
      book as Book,
      pages as Page[],
      options
    )

    // Get cover image from first page
    const firstPage = pages[0] as Page
    const coverImageUrl = firstPage.permanent_image_url || firstPage.image_url || undefined

    // Upload to storage (MP3 for now, M4B planned for future)
    const filename = generateAudioFilename(book as Book, 'mp3')
    const audiobookPath = `${user.id}/${bookId}/exports/audiobook-${filename}`
    const audiobookUrl = await uploadToStorage(mp3Buffer, audiobookPath, 'audio/mpeg')

    // Update book with audiobook URL
    const { error: updateError } = await supabase
      .from('books')
      .update({
        audiobook_url: audiobookUrl,
        audiobook_generated_at: new Date().toISOString(),
        export_metadata: {
          ...(book.export_metadata || {}),
          audiobook: {
            voiceName: options.voiceName,
            voiceId: options.voiceId,
            modelId: options.modelId,
            stability: options.stability,
            similarityBoost: options.similarityBoost,
            silenceDuration: options.silenceDuration,
            hasCoverArt: !!coverImageUrl,
            estimatedCost,
            generatedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', bookId)

    if (updateError) {
      console.error('Failed to update book with audiobook URL:', updateError)
      // Continue anyway - the audiobook was generated successfully
    }

    return NextResponse.json({
      success: true,
      audiobookUrl,
      filename,
      estimatedCost,
      hasCoverArt: !!coverImageUrl,
      message: 'Audiobook generated successfully',
    })
  } catch (error) {
    console.error('Audiobook generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate audiobook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/books/[id]/export/audiobook
 * Returns the URL of the existing audiobook or status
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await context.params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('audiobook_url, audiobook_generated_at, export_metadata')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.audiobook_url) {
      return NextResponse.json({
        exists: true,
        audiobookUrl: book.audiobook_url,
        generatedAt: book.audiobook_generated_at,
        metadata: book.export_metadata?.audiobook,
      })
    } else {
      return NextResponse.json({
        exists: false,
        message: 'Audiobook has not been generated yet',
      })
    }
  } catch (error) {
    console.error('Audiobook check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check audiobook status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
