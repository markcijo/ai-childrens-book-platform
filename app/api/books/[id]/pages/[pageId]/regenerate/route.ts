/**
 * API endpoint to regenerate a single page image
 * 
 * POST /api/books/:id/pages/:pageId/regenerate
 * 
 * Regenerates the image for a specific page using character references
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImage } from '@/lib/services/image-generator';
import { uploadPageImage, isStorageConfigured } from '@/lib/services/storage';
import { buildCharacterAwarePrompt } from '@/lib/services/character-extractor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: bookId, pageId } = await params;
    const supabase = await createClient();

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const { 
      customPrompt, // Optional: override the image prompt
      useCharacterReference = true, // Whether to use character references
    } = body;

    // 1. Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify book ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, user_id, title')
      .eq('id', bookId)
      .single();

    if (bookError || !book || book.user_id !== user.id) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // 3. Get page
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('book_id', bookId)
      .single();

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // 4. Update page status
    await supabase
      .from('pages')
      .update({ status: 'generating' })
      .eq('id', pageId);

    // 5. Determine image prompt
    const imagePrompt = customPrompt || page.image_prompt;
    if (!imagePrompt) {
      throw new Error('No image prompt available for this page');
    }

    // 6. Get character reference if needed
    let referenceImage: string | undefined;
    
    if (useCharacterReference) {
      // Get characters for this book
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .order('role'); // Main characters first

      // Use the first main character's image as reference
      if (characters && characters.length > 0) {
        const mainChar = characters.find((c: any) => c.role === 'main_character') || characters[0];
        referenceImage = mainChar.permanent_image_url || mainChar.reference_image_url;
      }
    }

    // 7. Extract character names from the scene for enhanced prompt
    const characterNames: string[] = [];
    if (useCharacterReference) {
      // Simple extraction - look for capitalized names in the text
      const words = page.text.split(/\s+/);
      const potentialNames = words.filter((w: string) => /^[A-Z][a-z]+$/.test(w));
      characterNames.push(...potentialNames);
    }

    // 8. Build character-aware prompt
    let enhancedPrompt = imagePrompt;
    if (characterNames.length > 0) {
      enhancedPrompt = await buildCharacterAwarePrompt(
        imagePrompt,
        characterNames,
        bookId,
        user.id
      );
    }

    // 9. Generate image
    console.log(`Regenerating image for page ${page.page_number}...`);
    console.log(`Using character reference: ${referenceImage ? 'Yes' : 'No'}`);
    
    const result = await generateImage({
      prompt: enhancedPrompt,
      aspectRatio: '1:1',
      outputFormat: 'webp',
      outputQuality: 90,
      referenceImage,
      referenceStrength: 0.6, // Higher strength for better character consistency
    });

    // 10. Upload to permanent storage if configured
    let permanentUrl: string | undefined;
    if (isStorageConfigured()) {
      try {
        permanentUrl = await uploadPageImage(
          result.url,
          user.id,
          bookId,
          page.page_number
        );
        console.log(`✓ Uploaded to permanent storage: ${permanentUrl}`);
      } catch (uploadError) {
        console.error('Failed to upload to permanent storage:', uploadError);
        // Continue anyway - we still have the Replicate URL
      }
    }

    // 11. Update page in database
    const { error: updateError } = await supabase
      .from('pages')
      .update({
        image_url: result.url,
        permanent_image_url: permanentUrl,
        status: 'complete',
        generation_metadata: {
          regenerated: true,
          regenerated_at: new Date().toISOString(),
          used_character_reference: !!referenceImage,
          reference_image: referenceImage,
        },
      })
      .eq('id', pageId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✓ Regenerated image for page ${page.page_number}`);

    // 12. Return success
    return NextResponse.json({
      success: true,
      page: {
        id: pageId,
        page_number: page.page_number,
        image_url: result.url,
        permanent_image_url: permanentUrl,
        used_character_reference: !!referenceImage,
      },
      message: `Successfully regenerated page ${page.page_number}`,
    });
  } catch (error) {
    console.error('Page regeneration error:', error);
    
    // Update page status to error
    const { id: bookId, pageId } = await params;
    const supabase = await createClient();
    await supabase
      .from('pages')
      .update({ status: 'error' })
      .eq('id', pageId);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to regenerate page',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
