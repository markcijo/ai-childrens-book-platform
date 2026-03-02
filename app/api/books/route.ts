import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { projectId, title, storyIdea, ageRange, genre, pageCount } = body

    // Validate required fields
    if (!projectId || !title || !storyIdea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate page count
    if (pageCount < 4 || pageCount > 24) {
      return NextResponse.json(
        { error: 'Page count must be between 4 and 24' },
        { status: 400 }
      )
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title,
        story_idea: storyIdea,
        age_range: ageRange,
        genre,
        page_count: pageCount,
        status: 'draft',
      })
      .select()
      .single()

    if (bookError) {
      console.error('Error creating book:', bookError)
      return NextResponse.json(
        { error: 'Failed to create book' },
        { status: 500 }
      )
    }

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get project_id from query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    let query = supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Filter by project if specified
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: books, error: booksError } = await query

    if (booksError) {
      console.error('Error fetching books:', booksError)
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      )
    }

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error in GET /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
