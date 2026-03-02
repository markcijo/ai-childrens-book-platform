/**
 * API endpoint to extract characters from book
 * 
 * POST /api/books/:id/extract-characters
 * 
 * Analyzes the story and first generated image to create a character bible
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCharactersFromBook } from '@/lib/services/character-extractor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const supabase = await createClient();

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
      .select('id, user_id, title, characters_extracted, character_extraction_status')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 3. Check if characters already extracted
    if (book.characters_extracted && book.character_extraction_status === 'complete') {
      // Return existing characters
      const { data: existingChars } = await supabase
        .from('characters')
        .select('*')
        .eq('book_id', bookId)
        .order('first_seen_page');

      return NextResponse.json({
        success: true,
        alreadyExtracted: true,
        characters: existingChars || [],
      });
    }

    // 4. Update status to extracting
    await supabase
      .from('books')
      .update({ character_extraction_status: 'extracting' })
      .eq('id', bookId)
      .eq('user_id', user.id);

    // 5. Extract characters
    const characters = await extractCharactersFromBook(bookId, user.id);

    // 6. Return success
    return NextResponse.json({
      success: true,
      characters,
      message: `Extracted ${characters.length} character(s) from ${book.title}`,
    });
  } catch (error) {
    console.error('Character extraction error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        error: 'Failed to extract characters',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/books/:id/extract-characters
 * 
 * Get characters for a book
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify book ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, user_id')
      .eq('id', bookId)
      .single();

    if (bookError || !book || book.user_id !== user.id) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Get characters
    const { data: characters, error: charsError } = await supabase
      .from('characters')
      .select('*')
      .eq('book_id', bookId)
      .order('first_seen_page');

    if (charsError) {
      throw charsError;
    }

    return NextResponse.json({
      success: true,
      characters: characters || [],
    });
  } catch (error) {
    console.error('Get characters error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get characters',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
