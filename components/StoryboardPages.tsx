import { Page } from '@/lib/types/database'
import RegeneratePageButton from './RegeneratePageButton'

type StoryboardPagesProps = {
  pages: Page[]
  bookId: string
  onPageRegenerated?: () => void
}

export default function StoryboardPages({ pages, bookId, onPageRegenerated }: StoryboardPagesProps) {
  if (!pages || pages.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
        <p className="text-gray-500">No pages generated yet. Click "Generate Story" to create your book!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Storyboard</h2>
        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {pages.length} {pages.length === 1 ? 'page' : 'pages'}
        </span>
      </div>

      <div className="grid gap-6">
        {pages.map((page) => (
          <div
            key={page.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Page {page.page_number}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  page.status === 'complete' ? 'bg-green-100 text-green-800' :
                  page.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                  page.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {page.status}
                </span>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-6 space-y-4">
              {/* Scene Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  🎬 Scene Description
                </h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {page.scene_description}
                </p>
              </div>

              {/* Narration Text */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  📖 Narration Text
                </h4>
                <p className="text-gray-800 leading-relaxed italic">
                  {page.text}
                </p>
              </div>

              {/* Image Prompt */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  🎨 Image Generation Prompt
                </h4>
                <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-200 font-mono text-xs">
                  {page.image_prompt}
                </p>
              </div>

              {/* Generated Image or Placeholder */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    🖼️ Generated Illustration
                  </h4>
                  {page.image_url && (
                    <RegeneratePageButton
                      bookId={bookId}
                      pageId={page.id}
                      pageNumber={page.page_number}
                      onSuccess={onPageRegenerated}
                      compact
                    />
                  )}
                </div>
                {page.image_url ? (
                  <div className="relative group">
                    <img
                      src={page.permanent_image_url || page.image_url}
                      alt={`Page ${page.page_number} illustration`}
                      className="rounded-lg border-2 border-gray-300 w-full shadow-lg hover:shadow-xl transition-shadow"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg pointer-events-none" />
                    {page.permanent_image_url && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Permanently stored
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      {page.status === 'generating' ? (
                        <>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
                          <p className="text-sm font-semibold">Generating image...</p>
                          <p className="text-xs mt-1">This may take 2-3 minutes</p>
                        </>
                      ) : page.status === 'error' ? (
                        <>
                          <p className="text-sm text-red-600 font-semibold">❌ Generation failed</p>
                          <p className="text-xs mt-1">Try regenerating this page</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">🎨 No image yet</p>
                          <p className="text-xs mt-1">Click "Generate Images" to create illustrations</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
