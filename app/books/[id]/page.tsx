import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BookDetailLayout from '@/components/BookDetailLayout'

interface BookPageProps {
  params: Promise<{ id: string }>
}

export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (bookError || !book) {
    notFound()
  }

  // Fetch pages count (will be used in Session 3)
  const { count: pagesCount } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', id)

  return (
    <BookDetailLayout book={book} projectId={book.project_id}>
      <div className="space-y-6">
        {/* Book metadata card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Book Details</h2>
          
          <div className="space-y-4">
            {book.story_idea && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Story Idea
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {book.story_idea}
                </p>
              </div>
            )}

            {book.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Description
                </h3>
                <p className="text-gray-900">{book.description}</p>
              </div>
            )}

            {book.moral && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Moral/Theme
                </h3>
                <p className="text-gray-900">{book.moral}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {book.age_range && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Target Age
                  </h3>
                  <p className="text-gray-900">{book.age_range} years</p>
                </div>
              )}

              {book.genre && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">
                    Genre
                  </h3>
                  <p className="text-gray-900">{book.genre}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  book.status === 'draft'
                    ? 'bg-gray-400'
                    : book.status === 'generating'
                    ? 'bg-blue-500 animate-pulse'
                    : book.status === 'complete'
                    ? 'bg-green-500'
                    : 'bg-purple-500'
                }`}
              />
              <span className="font-medium capitalize">{book.status}</span>
            </div>

            {book.status === 'draft' && (
              <p className="text-sm text-gray-600">
                Your book is in draft mode. Generate the story and illustrations
                to bring it to life!
              </p>
            )}

            {book.status === 'generating' && (
              <p className="text-sm text-gray-600">
                We're generating your book. This may take a few minutes...
              </p>
            )}

            {book.status === 'complete' && (
              <p className="text-sm text-gray-600">
                Your book is complete! You can now export it or make edits.
              </p>
            )}
          </div>
        </div>

        {/* Pages placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Pages</h2>
            <span className="text-sm text-gray-500">
              {pagesCount || 0} / {book.page_count} pages
            </span>
          </div>

          {pagesCount === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-lg font-medium mb-2">No pages yet</p>
              <p className="text-sm">
                Page generation will be available in the next update!
              </p>
            </div>
          ) : (
            <div className="text-gray-500">
              Page management coming in Session 3...
            </div>
          )}
        </div>

        {/* Actions */}
        {book.status === 'draft' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <p className="text-sm text-blue-800 mb-4">
              Story generation and illustration features will be available in
              upcoming sessions!
            </p>
            <button
              disabled
              className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed"
            >
              Generate Story (Coming Soon)
            </button>
          </div>
        )}
      </div>
    </BookDetailLayout>
  )
}
