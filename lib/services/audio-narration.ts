/**
 * Audio Narration Service
 * 
 * Generates narration audio using ElevenLabs text-to-speech API.
 * Combines multiple page narrations into a single audio file.
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import type { Page, Book } from '@/lib/types/database'

// Initialize ElevenLabs client
const getElevenLabsClient = () => {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }
  return new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })
}

export interface NarrationOptions {
  voiceId?: string
  voiceName?: string
  modelId?: string
  stability?: number
  similarityBoost?: number
  silenceDuration?: number // Milliseconds of silence between pages
}

/**
 * Default voice options for children's books
 */
export const DEFAULT_VOICE_OPTIONS: NarrationOptions = {
  voiceId: undefined, // Use voiceName instead
  voiceName: 'Rachel', // Warm, friendly female voice
  modelId: 'eleven_turbo_v2_5', // Fast, cost-effective
  stability: 0.5, // Balanced
  similarityBoost: 0.75, // Clear pronunciation
  silenceDuration: 1500, // 1.5 seconds between pages
}

/**
 * Popular voices for children's narration
 */
export const CHILDREN_VOICES = {
  rachel: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Warm, calm, friendly' },
  domi: { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Energetic, expressive' },
  bella: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Soft, gentle' },
  nicole: { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', description: 'Confident, clear' },
}

/**
 * Generate narration for a single page
 */
export async function generatePageNarration(
  text: string,
  options: NarrationOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_VOICE_OPTIONS, ...options }
  const elevenlabs = getElevenLabsClient()

  // Get voice ID (either from voiceId or lookup by voiceName)
  let voiceId = opts.voiceId
  if (!voiceId && opts.voiceName) {
    const voice = Object.values(CHILDREN_VOICES).find(
      v => v.name.toLowerCase() === opts.voiceName?.toLowerCase()
    )
    voiceId = voice?.id || CHILDREN_VOICES.rachel.id
  }

  if (!voiceId) {
    throw new Error('Voice ID or voice name must be provided')
  }

  try {
    // Generate speech
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      modelId: opts.modelId,
      voiceSettings: {
        stability: opts.stability,
        similarityBoost: opts.similarityBoost,
      },
    })

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const reader = audioStream.getReader()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    return Buffer.concat(chunks)
  } catch (error) {
    console.error('ElevenLabs TTS error:', error)
    throw new Error(`Failed to generate narration: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate narration for all pages in a book
 */
export async function generateBookNarration(
  book: Book,
  pages: Page[],
  options: NarrationOptions = {}
): Promise<{ audioBuffers: Buffer[], combinedBuffer: Buffer }> {
  const opts = { ...DEFAULT_VOICE_OPTIONS, ...options }

  console.log(`Generating narration for ${pages.length} pages...`)

  // Generate audio for each page
  const audioBuffers: Buffer[] = []
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    console.log(`Generating page ${i + 1}/${pages.length}...`)
    
    try {
      const audioBuffer = await generatePageNarration(page.narration_text || page.text, opts)
      audioBuffers.push(audioBuffer)
      
      // Add silence between pages (except last page)
      if (i < pages.length - 1 && opts.silenceDuration && opts.silenceDuration > 0) {
        const silenceBuffer = generateSilence(opts.silenceDuration)
        audioBuffers.push(silenceBuffer)
      }
    } catch (error) {
      console.error(`Failed to generate narration for page ${page.page_number}:`, error)
      throw error
    }
  }

  // Combine all audio buffers
  const combinedBuffer = Buffer.concat(audioBuffers)

  return {
    audioBuffers,
    combinedBuffer,
  }
}

/**
 * Generate silence buffer (MP3 format)
 * Creates a minimal silent MP3 buffer
 */
function generateSilence(durationMs: number): Buffer {
  // For simplicity, we'll use a pre-generated silence buffer
  // This is a minimal valid MP3 frame representing silence
  // In production, you might want to use ffmpeg to generate proper silence
  
  const silenceDuration = Math.max(100, Math.min(durationMs, 5000)) // Clamp between 100ms and 5s
  const framesNeeded = Math.ceil(silenceDuration / 26) // ~26ms per MP3 frame
  
  // Minimal silent MP3 frame (MPEG1 Layer3, 128kbps, 44.1kHz)
  const silentFrame = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 sync word and header
    ...Array(417).fill(0x00), // Silent audio data
  ])
  
  const frames = Array(framesNeeded).fill(silentFrame)
  return Buffer.concat(frames)
}

/**
 * Generate audio filename from book title
 */
export function generateAudioFilename(book: Book, format: 'mp3' = 'mp3'): string {
  const sanitized = book.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  return `${sanitized}.${format}`
}

/**
 * Estimate audio duration in seconds
 * Rough estimate: ~150 words per minute for narration
 */
export function estimateAudioDuration(text: string): number {
  const words = text.split(/\s+/).length
  const minutes = words / 150
  return Math.ceil(minutes * 60)
}

/**
 * Estimate cost for ElevenLabs narration
 * Pricing: ~$0.30 per 1000 characters (varies by plan)
 */
export function estimateNarrationCost(text: string): number {
  const characters = text.length
  const costPer1000Chars = 0.30
  return (characters / 1000) * costPer1000Chars
}
