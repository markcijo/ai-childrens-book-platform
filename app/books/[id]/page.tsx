import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BookDetailLayout from '@/components/BookDetailLayout'
import GenerateStoryButton from '@/components/GenerateStoryButton'
import GenerateImagesButton from '@/components/GenerateImagesButton'
import ExtractCharactersButton from '@/components/ExtractCharactersButton'
import BookCharacters from '@/components/BookCharacters'
import StoryboardPages from '@/components/StoryboardPages'
import ExportButtons from '@/components/ExportButtons'

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

  // Fetch pages
  const { data: pages, count: pagesCount } = await supabase
    .from('pages')
    .select('*', { count: 'exact' })
    .eq('book_id', id)
    .order('page_number', { ascending: true })

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

        {/* Generate Story Button */}
        {book.status === 'draft' && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="font-semibold text-indigo-900 mb-2">Ready to Create Your Story?</h3>
            <p className="text-sm text-indigo-800 mb-4">
              Click the button below to generate your complete story with {book.page_count} pages, 
              scene descriptions, and image prompts tailored for {book.age_range} year-olds.
            </p>
            <GenerateStoryButton bookId={id} bookStatus={book.status} />
          </div>
        )}

        {/* Generating Status */}
        {book.status === 'generating' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="font-semibold text-blue-900">Generating Your Story...</h3>
            </div>
            <p className="text-sm text-blue-800">
              Our AI is crafting your {book.page_count}-page {book.genre.toLowerCase()} story. 
              This usually takes 30-60 seconds. Feel free to refresh the page to check progress.
            </p>
          </div>
        )}

        {/* Generate Images Button */}
        {book.status === 'complete' && pages && pages.length > 0 && (
          (() => {
            const pagesWithoutImages = pages.filter(p => !p.image_url)
            const hasAnyImages = pages.some(p => p.image_url)
            
            if (pagesWithoutImages.length > 0) {
              return (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    {hasAnyImages ? 'Continue Generating Images' : 'Ready to Create Illustrations?'}
                  </h3>
                  <p className="text-sm text-purple-800 mb-4">
                    {hasAnyImages 
                      ? `${pagesWithoutImages.length} ${pagesWithoutImages.length === 1 ? 'page needs' : 'pages need'} illustrations. Continue generating to complete your book!`
                      : `Your story is ready! Generate beautiful AI illustrations for all ${pages.length} pages.`
                    }
                  </p>
                  <GenerateImagesButton bookId={id} />
                </div>
              )
            }
            return null
          })()
        )}

        {/* Extract Characters Section */}
        {book.status === 'complete' && pages && pages.some(p => p.image_url) && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">Character Consistency</h3>
            <p className="text-sm text-purple-800 mb-4">
              Extract character descriptions from your book to ensure they look consistent across all pages.
            </p>
            <ExtractCharactersButton
              bookId={id}
              hasImages={pages.some(p => p.image_url)}
              charactersExtracted={book.characters_extracted || false}
            />
          </div>
        )}

        {/* Book Characters Display */}
        {book.characters_extracted && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <BookCharacters bookId={id} />
          </div>
        )}

        {/* Export Buttons */}
        {book.status === 'complete' && pages && pages.length > 0 && (
          <ExportButtons 
            book={book} 
            hasImages={pages.some(p => p.permanent_image_url || p.image_url)}
          />
        )}

        {/* Storyboard Pages */}
        {book.status === 'complete' && pages && (
          <StoryboardPages pages={pages} bookId={id} />
        )}
        
        {/* Also show storyboard while generating images */}
        {book.status === 'generating_images' && pages && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="font-semibold text-purple-900">Generating Images...</h3>
              </div>
              <p className="text-sm text-purple-800">
                Creating beautiful illustrations for your {pages.length}-page book. 
                Images appear in the storyboard as they're generated (2-3 minutes each).
              </p>
            </div>
            <StoryboardPages pages={pages} bookId={id} />
          </>
        )}
      </div>
    </BookDetailLayout>
  )
}
