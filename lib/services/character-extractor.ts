/**
 * Character extraction service
 * 
 * Analyzes book story and first generated image to extract character descriptions
 * Creates a "character bible" for consistency across pages
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedCharacter {
  name: string;
  description: string;
  appearance_details: {
    species?: string;
    age_appearance?: string;
    hair_color?: string;
    hair_style?: string;
    eye_color?: string;
    skin_tone?: string;
    height?: string;
    build?: string;
    clothing?: string;
    distinctive_features?: string[];
    colors?: string[]; // Main colors associated with character
  };
  personality?: string;
  role: 'main_character' | 'supporting' | 'background';
}

/**
 * Extract characters from book story and first image
 * 
 * Uses Claude's vision capability to analyze the first page image
 * and story text to create detailed character descriptions
 * 
 * @param bookId - Book ID
 * @param userId - User ID
 * @returns Array of extracted characters
 */
export async function extractCharactersFromBook(
  bookId: string,
  userId: string
): Promise<ExtractedCharacter[]> {
  const supabase = await createClient();

  try {
    // 1. Fetch book and first page with image
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*, pages(*)')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (bookError || !book) {
      throw new Error('Book not found');
    }

    if (!book.pages || book.pages.length === 0) {
      throw new Error('Book has no pages');
    }

    // Find first page with an image
    const firstPageWithImage = book.pages
      .sort((a: any, b: any) => a.page_number - b.page_number)
      .find((p: any) => p.image_url || p.permanent_image_url);

    if (!firstPageWithImage) {
      throw new Error('No pages with images found');
    }

    const referenceImageUrl = firstPageWithImage.permanent_image_url || firstPageWithImage.image_url;

    // 2. Fetch the image as base64 for Claude
    const imageResponse = await fetch(referenceImageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch reference image');
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mediaType = imageResponse.headers.get('content-type') || 'image/webp';

    // 3. Ask Claude to extract characters
    const extractionPrompt = `You are analyzing a children's book illustration to extract character information for consistency across pages.

**Story Context:**
${book.story_text || book.description}

**Your task:**
Analyze this illustration and extract detailed descriptions of ALL characters that appear.

For EACH character, provide:
1. **Name** - Character's name (from story context)
2. **Role** - main_character, supporting, or background
3. **Physical Description** - Detailed visual description for consistent regeneration:
   - Species (human, animal, creature, etc.)
   - Age appearance (child, adult, elderly, etc.)
   - Hair (color, style, length)
   - Eyes (color, shape)
   - Skin tone / fur color
   - Height and build
   - Clothing and outfit details
   - Distinctive features (glasses, scarf, patterns, markings, etc.)
   - Main colors associated with the character
4. **Personality** - Brief personality traits (from story context)

**Return ONLY valid JSON** in this exact format:
{
  "characters": [
    {
      "name": "Luna",
      "role": "main_character",
      "description": "A young bunny with soft white fur and large expressive brown eyes...",
      "appearance_details": {
        "species": "rabbit",
        "age_appearance": "young child",
        "hair_color": "white",
        "hair_style": "fluffy fur",
        "eye_color": "brown",
        "skin_tone": "white fur",
        "height": "small",
        "build": "petite",
        "clothing": "blue dress with white collar",
        "distinctive_features": ["long floppy ears", "pink nose", "white cotton tail"],
        "colors": ["white", "blue", "pink"]
      },
      "personality": "curious, brave, kind-hearted"
    }
  ]
}

Focus on details that will help reproduce the exact same character appearance in future illustrations.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as any,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: extractionPrompt,
            },
          ],
        },
      ],
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '').trim();
    }

    const parsed = JSON.parse(jsonText);
    const characters: ExtractedCharacter[] = parsed.characters || [];

    // 4. Save characters to database
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      
      const { error: insertError } = await supabase
        .from('characters')
        .insert({
          book_id: bookId,
          user_id: userId,
          name: char.name,
          description: char.description,
          appearance_details: char.appearance_details,
          personality: char.personality,
          role: char.role,
          reference_image_url: referenceImageUrl,
          first_seen_page: firstPageWithImage.page_number,
        });

      if (insertError) {
        console.error('Error saving character:', insertError);
      }
    }

    // 5. Update book status
    await supabase
      .from('books')
      .update({
        characters_extracted: true,
        character_extraction_status: 'complete',
      })
      .eq('id', bookId)
      .eq('user_id', userId);

    return characters;
  } catch (error) {
    console.error('Error extracting characters:', error);
    
    // Update book status to error
    await supabase
      .from('books')
      .update({
        characters_extracted: false,
        character_extraction_status: 'error',
      })
      .eq('id', bookId)
      .eq('user_id', userId);

    throw error;
  }
}

/**
 * Get characters for a book
 * 
 * @param bookId - Book ID
 * @param userId - User ID
 * @returns Array of characters
 */
export async function getBookCharacters(bookId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .order('first_seen_page');

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Build character-aware image prompt
 * 
 * Enhances a scene description with character consistency details
 * 
 * @param sceneDescription - Original scene description
 * @param characterNames - Names of characters in this scene
 * @param bookId - Book ID
 * @param userId - User ID
 * @returns Enhanced prompt with character details
 */
export async function buildCharacterAwarePrompt(
  sceneDescription: string,
  characterNames: string[],
  bookId: string,
  userId: string
): Promise<string> {
  if (characterNames.length === 0) {
    return sceneDescription;
  }

  const characters = await getBookCharacters(bookId, userId);
  const relevantChars = characters.filter(c => 
    characterNames.some(name => 
      c.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(c.name.toLowerCase())
    )
  );

  if (relevantChars.length === 0) {
    return sceneDescription;
  }

  // Build character descriptions for prompt
  const charDescriptions = relevantChars
    .map(c => `${c.name}: ${c.description}`)
    .join('. ');

  return `${sceneDescription}. Character details: ${charDescriptions}`;
}
