import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage, validateReplicateConfig } from '@/lib/services/image-generator'
import { uploadPageImage, isStorageConfigured } from '@/lib/services/storage'
import { extractCharactersFromBook, buildCharacterAwarePrompt } from '@/lib/services/character-extractor'

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

    // Get all pages for this book that have image prompts but no images yet
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

    console.log(`Generating images for ${pagesToGenerate.length} pages...`)

    // Update book status to 'generating_images'
    await supabase
      .from('books')
      .update({ status: 'generating_images' })
      .eq('id', bookId)

    // Update all pages to 'generating' status
    await supabase
      .from('pages')
      .update({ status: 'generating' })
      .in('id', pagesToGenerate.map(p => p.id))

    // Check if storage is configured
    const storageConfigured = isStorageConfigured()
    console.log(`Permanent storage: ${storageConfigured ? 'Configured' : 'Not configured (using temp URLs)'}`)

    // Generate images sequentially
    let successCount = 0
    let failureCount = 0
    let characterReferenceImage: string | undefined
    let charactersExtracted = false

    for (let i = 0; i < pagesToGenerate.length; i++) {
      const page = pagesToGenerate[i]
      
      try {
        console.log(`Generating image ${i + 1}/${pagesToGenerate.length} for page ${page.page_number}...`)

        // For pages after the first, try to use character reference
        if (i > 0 && characterReferenceImage && !charactersExtracted) {
          // Extract characters from first page before generating subsequent pages
          try {
            console.log('Extracting characters from first page...')
            await extractCharactersFromBook(bookId, user.id)
            charactersExtracted = true
            console.log('✓ Characters extracted')
          } catch (extractError) {
            console.error('Character extraction failed, continuing without references:', extractError)
          }
        }

        // Get character reference if available
        let referenceImage = characterReferenceImage
        if (charactersExtracted && i > 0) {
          const { data: characters } = await supabase
            .from('characters')
            .select('*')
            .eq('book_id', bookId)
            .eq('user_id', user.id)
            .order('role')

          if (characters && characters.length > 0) {
            const mainChar = characters.find((c: any) => c.role === 'main_character') || characters[0]
            referenceImage = mainChar.permanent_image_url || mainChar.reference_image_url
          }
        }

        // Build character-aware prompt if characters exist
        let enhancedPrompt = page.image_prompt!
        if (charactersExtracted && i > 0) {
          // Simple character name extraction
          const words = pages.find(p => p.id === page.id)?.image_prompt?.split(/\s+/) || []
          const potentialNames = words.filter((w: string) => /^[A-Z][a-z]+$/.test(w))
          
          if (potentialNames.length > 0) {
            enhancedPrompt = await buildCharacterAwarePrompt(
              page.image_prompt!,
              potentialNames,
              bookId,
              user.id
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
            permanentUrl = await uploadPageImage(
              result.url,
              user.id,
              bookId,
              page.page_number
            )
            console.log(`✓ Uploaded to permanent storage`)
          } catch (uploadError) {
            console.error('Failed to upload to permanent storage:', uploadError)
          }
        }

        // Update page in database
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
        console.log(`✓ Generated image ${i + 1}/${pagesToGenerate.length}`)

        // Small delay between generations
        if (i < pagesToGenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      } catch (error) {
        console.error(`Failed to generate image for page ${page.page_number}:`, error)
        
        await supabase
          .from('pages')
          .update({ status: 'error' })
          .eq('id', page.id)

        failureCount++
      }
    }

    // Extract characters if not done yet (in case we only had 1 page)
    if (!charactersExtracted && successCount > 0) {
      try {
        console.log('Extracting characters from book...')
        await extractCharactersFromBook(bookId, user.id)
        console.log('✓ Characters extracted')
      } catch (extractError) {
        console.error('Character extraction failed:', extractError)
      }
    }

    // Update book status to 'complete' if all images generated successfully
    const finalStatus = failureCount === 0 ? 'complete' : 'partial'
    await supabase
      .from('books')
      .update({ status: finalStatus })
      .eq('id', bookId)

    // Fetch updated pages to return
    const { data: updatedPages } = await supabase
      .from('pages')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} images successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      stats: {
        total: pagesToGenerate.length,
        success: successCount,
        failed: failureCount,
      },
      pages: updatedPages,
    })

  } catch (error) {
    console.error('Error generating images:', error)
    
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
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
