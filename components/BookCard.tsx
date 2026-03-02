import Link from 'next/link'
import { Book } from '@/lib/types/database'

interface BookCardProps {
  book: Book
}

const statusStyles = {
  draft: 'bg-gray-100 text-gray-800',
  generating: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  published: 'bg-purple-100 text-purple-800',
}

const statusLabels = {
  draft: 'Draft',
  generating: 'Generating...',
  complete: 'Complete',
  published: 'Published',
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold line-clamp-1">{book.title}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              statusStyles[book.status]
            }`}
          >
            {statusLabels[book.status]}
          </span>
        </div>

        {book.story_idea && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {book.story_idea}
          </p>
        )}

        <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
          {book.age_range && (
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Ages {book.age_range}
            </span>
          )}
          
          {book.genre && (
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {book.genre}
            </span>
          )}
          
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
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
            {book.page_count} pages
          </span>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Created {new Date(book.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  )
}
