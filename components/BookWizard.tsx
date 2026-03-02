'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type WizardStep = 1 | 2 | 3

interface BookWizardProps {
  projectId: string
  onCancel?: () => void
}

interface BookFormData {
  storyIdea: string
  title: string
  ageRange: string
  genre: string
  pageCount: number
}

const AGE_RANGES = ['3-5', '6-8', '9-12', '13+']
const GENRES = [
  'Adventure',
  'Fantasy',
  'Educational',
  'Bedtime',
  'Moral Tale',
  'Animal Story',
  'Friendship',
  'Family',
  'Mystery',
  'Science Fiction',
]

export default function BookWizard({ projectId, onCancel }: BookWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BookFormData>({
    storyIdea: '',
    title: '',
    ageRange: '6-8',
    genre: 'Adventure',
    pageCount: 12,
  })

  const handleStoryIdeaChange = (value: string) => {
    // Limit to 500 characters
    if (value.length <= 500) {
      setFormData({ ...formData, storyIdea: value })
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.storyIdea.trim()) {
      alert('Please enter your story idea')
      return
    }
    if (currentStep === 2 && !formData.title.trim()) {
      alert('Please enter a title for your book')
      return
    }
    setCurrentStep((currentStep + 1) as WizardStep)
  }

  const handleBack = () => {
    setCurrentStep((currentStep - 1) as WizardStep)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          title: formData.title,
          storyIdea: formData.storyIdea,
          ageRange: formData.ageRange,
          genre: formData.genre,
          pageCount: formData.pageCount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create book')
      }

      const book = await response.json()
      router.push(`/books/${book.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating book:', error)
      alert('Failed to create book. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Story Idea</span>
          <span>Settings</span>
          <span>Review</span>
        </div>
      </div>

      {/* Step 1: Story Idea */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">What's your story idea?</h2>
          <p className="text-gray-600">
            Describe your story idea in a few sentences. Be creative!
          </p>
          <div>
            <textarea
              value={formData.storyIdea}
              onChange={(e) => handleStoryIdeaChange(e.target.value)}
              placeholder="Example: A brave little turtle who learns to overcome their fear of deep water by helping a friend..."
              className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {formData.storyIdea.length}/500 characters
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Basic Settings */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Book Settings</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Book Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter book title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <select
              value={formData.ageRange}
              onChange={(e) =>
                setFormData({ ...formData, ageRange: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {AGE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range} years
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre
            </label>
            <select
              value={formData.genre}
              onChange={(e) =>
                setFormData({ ...formData, genre: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Pages
            </label>
            <input
              type="number"
              min="4"
              max="24"
              value={formData.pageCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pageCount: parseInt(e.target.value) || 12,
                })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Between 4 and 24 pages</p>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Review Your Book</h2>
          
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Title</h3>
              <p>{formData.title}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">Story Idea</h3>
              <p className="whitespace-pre-wrap">{formData.storyIdea}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700">Age Range</h3>
                <p>{formData.ageRange} years</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Genre</h3>
                <p>{formData.genre}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">Pages</h3>
              <p>{formData.pageCount} pages</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Your book will be created with "draft" status. You can generate
            stories and illustrations in the next steps.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </button>
        
        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Book'}
          </button>
        )}
      </div>
    </div>
  )
}
