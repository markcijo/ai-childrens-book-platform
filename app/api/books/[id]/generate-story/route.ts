import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStory } from '@/lib/services/story-generator'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

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

    // Fetch the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Validate required fields
    if (!book.story_idea || !book.title || !book.age_range || !book.genre || !book.page_count) {
      return NextResponse.json(
        { error: 'Book is missing required fields for story generation' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Story generation is not configured. Please add ANTHROPIC_API_KEY to environment variables.' },
        { status: 500 }
      )
    }

    // Update book status to generating
    await supabase
      .from('books')
      .update({ status: 'generating' })
      .eq('id', bookId)

    // Generate the story using Claude
    const generatedStory = await generateStory({
      storyIdea: book.story_idea,
      title: book.title,
      ageRange: book.age_range,
      genre: book.genre,
      pageCount: book.page_count,
    })

    // Delete existing pages if any
    await supabase
      .from('pages')
      .delete()
      .eq('book_id', bookId)

    // Insert all pages
    const pagesData = generatedStory.pages.map((page) => ({
      book_id: bookId,
      page_number: page.pageNumber,
      text: page.narrationText,
      scene_description: page.sceneDescription,
      image_prompt: page.imagePrompt,
      status: 'complete' as const,
    }))

    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pagesData)

    if (pagesError) {
      console.error('Error inserting pages:', pagesError)
      
      // Revert book status
      await supabase
        .from('books')
        .update({ status: 'draft' })
        .eq('id', bookId)
      
      return NextResponse.json(
        { error: 'Failed to save generated pages' },
        { status: 500 }
      )
    }

    // Update book status to complete
    await supabase
      .from('books')
      .update({ 
        status: 'complete',
        story_text: generatedStory.pages.map(p => p.narrationText).join('\n\n'),
      })
      .eq('id', bookId)

    return NextResponse.json({
      success: true,
      message: 'Story generated successfully',
      pageCount: generatedStory.pages.length,
    })
  } catch (error) {
    console.error('Story generation error:', error)
    
    // Try to revert book status on error
    try {
      const { id: bookId } = await params
      const supabase = await createClient()
      await supabase
        .from('books')
        .update({ status: 'draft' })
        .eq('id', bookId)
    } catch (revertError) {
      console.error('Failed to revert book status:', revertError)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate story' },
      { status: 500 }
    )
  }
}
