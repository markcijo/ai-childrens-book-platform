/**
 * Export Buttons Component
 * 
 * Displays buttons to generate and download PDF, MP3, and M4B exports
 * Now uses async job queue for better UX
 */

'use client'

import { useState } from 'react'
import type { Book } from '@/lib/types/database'
import { JobProgress } from './JobProgress'

interface ExportButtonsProps {
  book: Book
  hasImages?: boolean
}

export default function ExportButtons({ book, hasImages = false }: ExportButtonsProps) {
  const [pdfJobId, setPdfJobId] = useState<string | null>(null)
  const [audioJobId, setAudioJobId] = useState<string | null>(null)
  const [audiobookJobId, setAudiobookJobId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExportPDF = async () => {
    if (!hasImages) {
      setError('Please generate images first before exporting PDF')
      return
    }

    setLoading('pdf')
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/books/${book.id}/export/pdf`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PDF export job')
      }

      setPdfJobId(data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    } finally {
      setLoading(null)
    }
  }

  const handleExportAudio = async () => {
    setLoading('audio')
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/books/${book.id}/export/audio`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create audio narration job')
      }

      setAudioJobId(data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audio')
    } finally {
      setLoading(null)
    }
  }

  const handleExportAudiobook = async () => {
    setLoading('audiobook')
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/books/${book.id}/export/audiobook`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create audiobook job')
      }

      setAudiobookJobId(data.jobId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audiobook')
    } finally {
      setLoading(null)
    }
  }

  const handleJobComplete = (type: 'pdf' | 'audio' | 'audiobook') => {
    setSuccess(`${type.toUpperCase()} generated successfully!`)
    
    // Clear job ID
    if (type === 'pdf') setPdfJobId(null)
    if (type === 'audio') setAudioJobId(null)
    if (type === 'audiobook') setAudiobookJobId(null)
    
    // Refresh page to show updated export URLs
    setTimeout(() => window.location.reload(), 1500)
  }

  const handleJobError = (errorMessage: string, type: 'pdf' | 'audio' | 'audiobook') => {
    setError(errorMessage)
    
    // Clear job ID
    if (type === 'pdf') setPdfJobId(null)
    if (type === 'audio') setAudioJobId(null)
    if (type === 'audiobook') setAudiobookJobId(null)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          📦 Export Your Book
        </h3>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <strong>{success}</strong>
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {/* PDF Export */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <h4 className="font-semibold text-gray-900">PDF Book</h4>
                <p className="text-xs text-gray-600">Print-ready document</p>
              </div>
            </div>

            {pdfJobId ? (
              <JobProgress
                jobId={pdfJobId}
                onComplete={() => handleJobComplete('pdf')}
                onError={(err) => handleJobError(err, 'pdf')}
              />
            ) : book.pdf_url ? (
              <div className="space-y-2">
                <a
                  href={book.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  📥 Download PDF
                </a>
                <button
                  onClick={handleExportPDF}
                  disabled={loading === 'pdf'}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                  🔄 Regenerate
                </button>
              </div>
            ) : (
              <button
                onClick={handleExportPDF}
                disabled={!hasImages || loading === 'pdf'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading === 'pdf' ? 'Starting...' : 'Generate PDF'}
              </button>
            )}

            {!hasImages && !book.pdf_url && (
              <p className="text-xs text-yellow-600">
                ⚠️ Generate images first
              </p>
            )}
          </div>

          {/* Audio Export */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎵</span>
              <div>
                <h4 className="font-semibold text-gray-900">MP3 Narration</h4>
                <p className="text-xs text-gray-600">Audio file</p>
              </div>
            </div>

            {audioJobId ? (
              <JobProgress
                jobId={audioJobId}
                onComplete={() => handleJobComplete('audio')}
                onError={(err) => handleJobError(err, 'audio')}
              />
            ) : book.audio_url ? (
              <div className="space-y-2">
                <a
                  href={book.audio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  📥 Download MP3
                </a>
                <button
                  onClick={handleExportAudio}
                  disabled={loading === 'audio'}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                  🔄 Regenerate
                </button>
              </div>
            ) : (
              <button
                onClick={handleExportAudio}
                disabled={loading === 'audio'}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading === 'audio' ? 'Starting...' : 'Generate Audio'}
              </button>
            )}
          </div>

          {/* Audiobook Export */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎧</span>
              <div>
                <h4 className="font-semibold text-gray-900">M4B Audiobook</h4>
                <p className="text-xs text-gray-600">Audiobook format</p>
              </div>
            </div>

            {audiobookJobId ? (
              <JobProgress
                jobId={audiobookJobId}
                onComplete={() => handleJobComplete('audiobook')}
                onError={(err) => handleJobError(err, 'audiobook')}
              />
            ) : book.audiobook_url ? (
              <div className="space-y-2">
                <a
                  href={book.audiobook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  📥 Download M4B
                </a>
                <button
                  onClick={handleExportAudiobook}
                  disabled={loading === 'audiobook'}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                >
                  🔄 Regenerate
                </button>
              </div>
            ) : (
              <button
                onClick={handleExportAudiobook}
                disabled={loading === 'audiobook'}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {loading === 'audiobook' ? 'Starting...' : 'Generate Audiobook'}
              </button>
            )}
          </div>
        </div>

        {/* Info text */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Exports run in the background. You can navigate away and come back later to download your files.
          </p>
        </div>
      </div>
    </div>
  )
}
