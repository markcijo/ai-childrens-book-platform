/**
 * Audio Narration Export API Endpoint
 * 
 * POST /api/books/[id]/export/audio
 * Generates MP3 narration of the book using ElevenLabs TTS
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateBookNarration,
  generateAudioFilename,
  estimateNarrationCost,
  type NarrationOptions,
  CHILDREN_VOICES,
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

    // Fetch pages
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

    console.log(`Generating narration for book ${bookId}...`)
    console.log(`Estimated cost: $${estimatedCost.toFixed(2)}`)

    // Generate narration
    const { combinedBuffer } = await generateBookNarration(
      book as Book,
      pages as Page[],
      options
    )

    // Upload to storage
    const filename = generateAudioFilename(book as Book, 'mp3')
    const audioPath = `${user.id}/${bookId}/exports/${filename}`
    const audioUrl = await uploadToStorage(combinedBuffer, audioPath, 'audio/mpeg')

    // Update book with audio URL
    const { error: updateError } = await supabase
      .from('books')
      .update({
        audio_url: audioUrl,
        audio_generated_at: new Date().toISOString(),
        export_metadata: {
          ...(book.export_metadata || {}),
          audio: {
            voiceName: options.voiceName,
            voiceId: options.voiceId,
            modelId: options.modelId,
            stability: options.stability,
            similarityBoost: options.similarityBoost,
            silenceDuration: options.silenceDuration,
            estimatedCost,
            generatedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', bookId)

    if (updateError) {
      console.error('Failed to update book with audio URL:', updateError)
      // Continue anyway - the audio was generated successfully
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      filename,
      estimatedCost,
      message: 'Audio narration generated successfully',
    })
  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate audio narration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/books/[id]/export/audio
 * Returns the URL of the existing audio or status
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
      .select('audio_url, audio_generated_at, export_metadata')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.audio_url) {
      return NextResponse.json({
        exists: true,
        audioUrl: book.audio_url,
        generatedAt: book.audio_generated_at,
        metadata: book.export_metadata?.audio,
      })
    } else {
      return NextResponse.json({
        exists: false,
        message: 'Audio narration has not been generated yet',
      })
    }
  } catch (error) {
    console.error('Audio check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check audio status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/books/[id]/export/audio/voices
 * Returns available voices for narration
 */
export async function getVoices() {
  return NextResponse.json({
    voices: Object.values(CHILDREN_VOICES),
  })
}
