/**
 * Job Worker
 * 
 * Processes pending jobs from the queue.
 * Can be triggered via API route, cron, or serverless function.
 */

import { createClient } from '@/lib/supabase/server'
import { 
  Job, 
  JobType, 
  getPendingJobs, 
  updateJob, 
  failJob,
  shouldRetryJob 
} from './job-queue'
import { generateStory } from './story-generator'
import { generateImage } from './image-generator'
import { uploadPageImage, isStorageConfigured } from './storage'
import { extractCharactersFromBook, buildCharacterAwarePrompt } from './character-extractor'
import { generateBookPDF } from './pdf-generator'
import { generateBookNarration } from './audio-narration'

/**
 * Process a single job
 */
export async function processJob(job: Job): Promise<void> {
  const supabase = await createClient()
  
  console.log(`Processing job ${job.id} (${job.type})`)
  
  try {
    // Update status to processing
    await updateJob(job.id, {
      status: 'processing',
      progressPercent: 0,
      progressStep: 'Starting...',
    }, supabase)
    
    // Route to appropriate handler
    switch (job.type) {
      case 'story_generation':
        await processStoryGeneration(job, supabase)
        break
      
      case 'image_generation':
        await processImageGeneration(job, supabase)
        break
      
      case 'pdf_export':
        await processPDFExport(job, supabase)
        break
      
      case 'audio_export':
        await processAudioExport(job, supabase)
        break
      
      case 'audiobook_export':
        await processAudiobookExport(job, supabase)
        break
      
      case 'page_regeneration':
        await processPageRegeneration(job, supabase)
        break
      
      case 'character_extraction':
        await processCharacterExtraction(job, supabase)
        break
      
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
    
    // Mark as completed
    await updateJob(job.id, {
      status: 'completed',
      progressPercent: 100,
      progressStep: 'Complete',
    }, supabase)
    
    console.log(`✓ Job ${job.id} completed`)
    
  } catch (error) {
    console.error(`✗ Job ${job.id} failed:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await failJob(job.id, errorMessage, supabase)
  }
}

/**
 * Process story generation job
 */
async function processStoryGeneration(job: Job, supabase: any): Promise<void> {
  const { bookId, storyIdea, title, ageRange, genre, pageCount } = job.input_data || {}
  
  if (!bookId || !storyIdea || !title || !ageRange || !genre || !pageCount) {
    throw new Error('Missing required story generation parameters')
  }
  
  await updateJob(job.id, {
    progressPercent: 10,
    progressStep: 'Generating story with AI...',
  }, supabase)
  
  // Generate story
  const generatedStory = await generateStory({
    storyIdea,
    title,
    ageRange,
    genre,
    pageCount,
  })
  
  await updateJob(job.id, {
    progressPercent: 70,
    progressStep: 'Saving pages...',
  }, supabase)
  
  // Delete existing pages
  await supabase
    .from('pages')
    .delete()
    .eq('book_id', bookId)
  
  // Insert pages
  const pagesData = generatedStory.pages.map((page) => ({
    book_id: bookId,
    page_number: page.pageNumber,
    text: page.narrationText,
    scene_description: page.sceneDescription,
    image_prompt: page.imagePrompt,
    status: 'complete',
  }))
  
  const { error: pagesError } = await supabase
    .from('pages')
    .insert(pagesData)
  
  if (pagesError) {
    throw new Error(`Failed to save pages: ${pagesError.message}`)
  }
  
  // Update book
  await supabase
    .from('books')
    .update({
      status: 'complete',
      story_text: generatedStory.pages.map(p => p.narrationText).join('\n\n'),
    })
    .eq('id', bookId)
  
  await updateJob(job.id, {
    progressPercent: 100,
    resultData: {
      pageCount: generatedStory.pages.length,
    },
  }, supabase)
}

/**
 * Process image generation job
 */
async function processImageGeneration(job: Job, supabase: any): Promise<void> {
  const { bookId, userId } = job.input_data || {}
  
  if (!bookId || !userId) {
    throw new Error('Missing required image generation parameters')
  }
  
  // Get pages that need images
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, page_number, image_prompt, image_url')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })
  
  if (pagesError) {
    throw new Error(`Failed to fetch pages: ${pagesError.message}`)
  }
  
  const pagesToGenerate = pages.filter((p: any) => p.image_prompt && !p.image_url)
  
  if (pagesToGenerate.length === 0) {
    throw new Error('No pages need images')
  }
  
  await updateJob(job.id, {
    progressPercent: 5,
    progressStep: `Generating ${pagesToGenerate.length} images...`,
  }, supabase)
  
  const storageConfigured = isStorageConfigured()
  let characterReferenceImage: string | undefined
  let charactersExtracted = false
  let successCount = 0
  
  for (let i = 0; i < pagesToGenerate.length; i++) {
    const page = pagesToGenerate[i]
    const progress = Math.round(((i + 1) / pagesToGenerate.length) * 90) + 5
    
    await updateJob(job.id, {
      progressPercent: progress,
      progressStep: `Generating image ${i + 1} of ${pagesToGenerate.length}...`,
    }, supabase)
    
    // Extract characters after first page
    if (i > 0 && characterReferenceImage && !charactersExtracted) {
      try {
        await extractCharactersFromBook(bookId, userId)
        charactersExtracted = true
      } catch (err) {
        console.error('Character extraction failed:', err)
      }
    }
    
    // Get character reference if available
    let referenceImage = characterReferenceImage
    if (charactersExtracted && i > 0) {
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .order('role')
      
      if (characters && characters.length > 0) {
        const mainChar = characters.find((c: any) => c.role === 'main_character') || characters[0]
        referenceImage = mainChar.permanent_image_url || mainChar.reference_image_url
      }
    }
    
    // Build character-aware prompt if characters exist
    let enhancedPrompt = page.image_prompt
    if (charactersExtracted && i > 0) {
      const words = page.image_prompt?.split(/\s+/) || []
      const potentialNames = words.filter((w: string) => /^[A-Z][a-z]+$/.test(w))
      
      if (potentialNames.length > 0) {
        enhancedPrompt = await buildCharacterAwarePrompt(
          page.image_prompt,
          potentialNames,
          bookId,
          userId
        )
      }
    }
    
    // Generate image
    const result = await generateImage({
      prompt: enhancedPrompt,
      aspectRatio: '1:1',
      outputFormat: 'webp',
      outputQuality: 90,
      referenceImage: i > 0 ? referenceImage : undefined,
      referenceStrength: 0.6,
    })
    
    // Save reference from first page
    if (i === 0) {
      characterReferenceImage = result.url
    }
    
    // Upload to permanent storage if configured
    let permanentUrl: string | undefined
    if (storageConfigured) {
      try {
        permanentUrl = await uploadPageImage(result.url, userId, bookId, page.page_number)
      } catch (err) {
        console.error('Failed to upload to storage:', err)
      }
    }
    
    // Update page
    await supabase
      .from('pages')
      .update({
        image_url: result.url,
        permanent_image_url: permanentUrl,
        status: 'complete',
        generation_metadata: {
          generated_at: new Date().toISOString(),
          used_character_reference: i > 0 && !!referenceImage,
          reference_image: referenceImage,
        },
      })
      .eq('id', page.id)
    
    successCount++
    
    // Small delay between generations
    if (i < pagesToGenerate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }
  
  // Extract characters if not done yet
  if (!charactersExtracted && successCount > 0) {
    try {
      await extractCharactersFromBook(bookId, userId)
    } catch (err) {
      console.error('Character extraction failed:', err)
    }
  }
  
  // Update book status
  await supabase
    .from('books')
    .update({ status: 'complete' })
    .eq('id', bookId)
  
  await updateJob(job.id, {
    resultData: {
      successCount,
      totalPages: pagesToGenerate.length,
    },
  }, supabase)
}

/**
 * Process PDF export job
 */
async function processPDFExport(job: Job, supabase: any): Promise<void> {
  const { bookId, userId } = job.input_data || {}
  
  if (!bookId || !userId) {
    throw new Error('Missing required PDF export parameters')
  }
  
  await updateJob(job.id, {
    progressPercent: 10,
    progressStep: 'Fetching book data...',
  }, supabase)
  
  // Get book and pages
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()
  
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })
  
  if (!book || !pages || pages.length === 0) {
    throw new Error('Book or pages not found')
  }
  
  await updateJob(job.id, {
    progressPercent: 40,
    progressStep: 'Generating PDF...',
  }, supabase)
  
  // Generate PDF buffer
  const pdfBuffer = await generateBookPDF(book, pages)
  
  await updateJob(job.id, {
    progressPercent: 70,
    progressStep: 'Uploading PDF...',
  }, supabase)
  
  // Upload PDF to storage (for now, create a temporary data URL)
  // TODO: Upload to R2/S3 for permanent storage
  const pdfBase64 = pdfBuffer.toString('base64')
  const pdfUrl = `data:application/pdf;base64,${pdfBase64}`
  
  await updateJob(job.id, {
    progressPercent: 90,
    progressStep: 'Saving PDF URL...',
  }, supabase)
  
  // Update book with PDF URL
  await supabase
    .from('books')
    .update({
      pdf_url: pdfUrl,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq('id', bookId)
  
  await updateJob(job.id, {
    resultData: { pdfUrl },
  }, supabase)
}

/**
 * Process audio export job (narration only)
 */
async function processAudioExport(job: Job, supabase: any): Promise<void> {
  const { bookId, userId } = job.input_data || {}
  
  if (!bookId || !userId) {
    throw new Error('Missing required audio export parameters')
  }
  
  await updateJob(job.id, {
    progressPercent: 10,
    progressStep: 'Fetching book data...',
  }, supabase)
  
  // Get book and pages
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()
  
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })
  
  if (!book || !pages || pages.length === 0) {
    throw new Error('Book or pages not found')
  }
  
  await updateJob(job.id, {
    progressPercent: 30,
    progressStep: 'Generating narration...',
  }, supabase)
  
  // Generate audio narration
  const { combinedBuffer } = await generateBookNarration(book, pages)
  
  await updateJob(job.id, {
    progressPercent: 70,
    progressStep: 'Uploading audio...',
  }, supabase)
  
  // Create data URL (TODO: Upload to R2/S3 for permanent storage)
  const audioBase64 = combinedBuffer.toString('base64')
  const audioUrl = `data:audio/mpeg;base64,${audioBase64}`
  
  await updateJob(job.id, {
    progressPercent: 90,
    progressStep: 'Saving audio URL...',
  }, supabase)
  
  await supabase
    .from('books')
    .update({
      audio_url: audioUrl,
      audio_generated_at: new Date().toISOString(),
    })
    .eq('id', bookId)
  
  await updateJob(job.id, {
    resultData: { audioUrl },
  }, supabase)
}

/**
 * Process audiobook export job (M4B format)
 */
async function processAudiobookExport(job: Job, supabase: any): Promise<void> {
  const { bookId, userId } = job.input_data || {}
  
  if (!bookId || !userId) {
    throw new Error('Missing required audiobook export parameters')
  }
  
  await updateJob(job.id, {
    progressPercent: 10,
    progressStep: 'Fetching book data...',
  }, supabase)
  
  // Get book and pages
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()
  
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })
  
  if (!book || !pages || pages.length === 0) {
    throw new Error('Book or pages not found')
  }
  
  await updateJob(job.id, {
    progressPercent: 30,
    progressStep: 'Generating audiobook...',
  }, supabase)
  
  // Generate audiobook (same as audio narration for now)
  const { combinedBuffer } = await generateBookNarration(book, pages)
  
  await updateJob(job.id, {
    progressPercent: 70,
    progressStep: 'Uploading audiobook...',
  }, supabase)
  
  // Create data URL (TODO: Upload to R2/S3 for permanent storage)
  const audiobookBase64 = combinedBuffer.toString('base64')
  const audiobookUrl = `data:audio/mpeg;base64,${audiobookBase64}`
  
  await updateJob(job.id, {
    progressPercent: 90,
    progressStep: 'Saving audiobook URL...',
  }, supabase)
  
  await supabase
    .from('books')
    .update({
      audiobook_url: audiobookUrl,
      audiobook_generated_at: new Date().toISOString(),
    })
    .eq('id', bookId)
  
  await updateJob(job.id, {
    resultData: { audiobookUrl },
  }, supabase)
}

/**
 * Process page regeneration job
 */
async function processPageRegeneration(job: Job, supabase: any): Promise<void> {
  const { pageId, userId, bookId } = job.input_data || {}
  
  if (!pageId || !userId) {
    throw new Error('Missing required page regeneration parameters')
  }
  
  await updateJob(job.id, {
    progressPercent: 20,
    progressStep: 'Regenerating page image...',
  }, supabase)
  
  // Get page
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single()
  
  if (!page) {
    throw new Error('Page not found')
  }
  
  // Get character reference if available
  let referenceImage: string | undefined
  if (bookId) {
    const { data: characters } = await supabase
      .from('characters')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .order('role')
    
    if (characters && characters.length > 0) {
      const mainChar = characters.find((c: any) => c.role === 'main_character') || characters[0]
      referenceImage = mainChar.permanent_image_url || mainChar.reference_image_url
    }
  }
  
  // Generate image
  const result = await generateImage({
    prompt: page.image_prompt,
    aspectRatio: '1:1',
    outputFormat: 'webp',
    outputQuality: 90,
    referenceImage,
    referenceStrength: 0.6,
  })
  
  await updateJob(job.id, {
    progressPercent: 70,
    progressStep: 'Uploading image...',
  }, supabase)
  
  // Upload to storage if configured
  let permanentUrl: string | undefined
  if (isStorageConfigured()) {
    try {
      permanentUrl = await uploadPageImage(result.url, userId, bookId, page.page_number)
    } catch (err) {
      console.error('Failed to upload to storage:', err)
    }
  }
  
  // Update page
  await supabase
    .from('pages')
    .update({
      image_url: result.url,
      permanent_image_url: permanentUrl,
      status: 'complete',
      generation_metadata: {
        regenerated_at: new Date().toISOString(),
        used_character_reference: !!referenceImage,
      },
    })
    .eq('id', pageId)
  
  await updateJob(job.id, {
    resultData: { imageUrl: permanentUrl || result.url },
  }, supabase)
}

/**
 * Process character extraction job
 */
async function processCharacterExtraction(job: Job, supabase: any): Promise<void> {
  const { bookId, userId } = job.input_data || {}
  
  if (!bookId || !userId) {
    throw new Error('Missing required character extraction parameters')
  }
  
  await updateJob(job.id, {
    progressPercent: 30,
    progressStep: 'Extracting characters...',
  }, supabase)
  
  await extractCharactersFromBook(bookId, userId)
  
  await updateJob(job.id, {
    progressPercent: 90,
    progressStep: 'Complete',
  }, supabase)
}

/**
 * Process all pending jobs
 */
export async function processAllPendingJobs(limit: number = 10): Promise<number> {
  const supabase = await createClient()
  const pendingJobs = await getPendingJobs(limit, supabase)
  
  console.log(`Found ${pendingJobs.length} pending jobs`)
  
  let processedCount = 0
  
  for (const job of pendingJobs) {
    // Check if job should be retried (exponential backoff)
    if (job.attempts > 0 && !shouldRetryJob(job)) {
      console.log(`Skipping job ${job.id} - waiting for backoff period`)
      continue
    }
    
    try {
      await processJob(job)
      processedCount++
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error)
    }
  }
  
  console.log(`Processed ${processedCount} jobs`)
  return processedCount
}
