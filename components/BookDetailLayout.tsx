import Link from 'next/link'
import { Book } from '@/lib/types/database'

interface BookDetailLayoutProps {
  book: Book
  projectId: string
  children?: React.ReactNode
}

const statusStyles = {
  draft: 'bg-gray-100 text-gray-800',
  generating: 'bg-blue-100 text-blue-800 animate-pulse',
  complete: 'bg-green-100 text-green-800',
  published: 'bg-purple-100 text-purple-800',
}

const statusLabels = {
  draft: 'Draft',
  generating: 'Generating...',
  complete: 'Complete',
  published: 'Published',
}

export default function BookDetailLayout({
  book,
  projectId,
  children,
}: BookDetailLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href={`/projects/${projectId}`}
              className="hover:text-blue-600"
            >
              Project
            </Link>
            <span>/</span>
            <span className="text-gray-900">{book.title}</span>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              {book.story_idea && (
                <p className="text-gray-600 max-w-2xl">{book.story_idea}</p>
              )}
            </div>

            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                statusStyles[book.status]
              }`}
            >
              {statusLabels[book.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-8 text-sm">
            {book.age_range && (
              <div>
                <span className="text-gray-500">Age Range:</span>{' '}
                <span className="font-medium">{book.age_range} years</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Pages:</span>{' '}
              <span className="font-medium">{book.page_count}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="font-medium">
                {new Date(book.created_at).toLocaleDateString()}
              </span>
            </div>
            {book.updated_at !== book.created_at && (
              <div>
                <span className="text-gray-500">Updated:</span>{' '}
                <span className="font-medium">
                  {new Date(book.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
    </div>
  )
}
