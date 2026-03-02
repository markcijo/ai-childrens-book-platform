'use client'

import { useState } from 'react'
import BookWizard from './BookWizard'

interface CreateBookButtonProps {
  projectId: string
}

export default function CreateBookButton({ projectId }: CreateBookButtonProps) {
  const [showWizard, setShowWizard] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        + Create Book
      </button>

      {/* Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create New Book</h2>
              <button
                onClick={() => setShowWizard(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <BookWizard
              projectId={projectId}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
