/**
 * Export Buttons Component
 * 
 * Displays buttons to generate and download PDF, MP3, and M4B exports
 */

'use client'

import { useState } from 'react'
import type { Book } from '@/lib/types/database'

interface ExportButtonsProps {
  book: Book
  hasImages?: boolean
}

export default function ExportButtons({ book, hasImages = false }: ExportButtonsProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audiobookLoading, setAudiobookLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExportPDF = async () => {
    if (!hasImages) {
      setError('Please generate images first before exporting PDF')
      return
    }

    setPdfLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/books/${book.id}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layout: 'image-top',
          fontSize: 14,
          includePageNumbers: true,
          includeCover: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF')
      }

      // Download the PDF
      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank')
        setSuccess('PDF generated successfully!')
        
        // Refresh page to show updated export URLs
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportAudio = async () => {
    setAudioLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/books/${book.id}/export/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName: 'Rachel',
          silenceDuration: 1500,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audio narration')
      }

      // Download the audio
      if (data.audioUrl) {
        window.open(data.audioUrl, '_blank')
        setSuccess(`Audio narration generated! Estimated cost: $${data.estimatedCost.toFixed(2)}`)
        
        // Refresh page to show updated export URLs
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audio')
    } finally {
      setAudioLoading(false)
    }
  }

  const handleExportAudiobook = async () => {
    setAudiobookLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/books/${book.id}/export/audiobook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName: 'Rachel',
          silenceDuration: 1500,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audiobook')
      }

      // Download the audiobook
      if (data.audiobookUrl) {
        window.open(data.audiobookUrl, '_blank')
        setSuccess(`Audiobook generated! Estimated cost: $${data.estimatedCost.toFixed(2)}`)
        
        // Refresh page to show updated export URLs
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audiobook')
    } finally {
      setAudiobookLoading(false)
    }
  }

  const handleDownloadExisting = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📦 Export Book</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* PDF Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                📄 PDF Book
                {book.pdf_url && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Generated
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Professional picture book layout with images and text. Perfect for printing or sharing.
              </p>
              {book.pdf_generated_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last generated: {new Date(book.pdf_generated_at).toLocaleString()}
                </p>
              )}
            </div>
            <div className="ml-4">
              {book.pdf_url ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleDownloadExisting(book.pdf_url!, `${book.title}.pdf`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium w-full"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={pdfLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium w-full disabled:opacity-50"
                  >
                    {pdfLoading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleExportPDF}
                  disabled={pdfLoading || !hasImages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {pdfLoading ? 'Generating...' : 'Generate PDF'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MP3 Audio Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                🎧 MP3 Narration
                {book.audio_url && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Generated
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Professional narration with natural voice. Great for bedtime listening.
              </p>
              {book.audio_generated_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last generated: {new Date(book.audio_generated_at).toLocaleString()}
                </p>
              )}
              {book.export_metadata?.audio?.voiceName && (
                <p className="text-xs text-gray-600 mt-1">
                  Voice: {book.export_metadata.audio.voiceName}
                </p>
              )}
            </div>
            <div className="ml-4">
              {book.audio_url ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleDownloadExisting(book.audio_url!, `${book.title}.mp3`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium w-full"
                  >
                    Download MP3
                  </button>
                  <button
                    onClick={handleExportAudio}
                    disabled={audioLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium w-full disabled:opacity-50"
                  >
                    {audioLoading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleExportAudio}
                  disabled={audioLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {audioLoading ? 'Generating...' : 'Generate MP3'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* M4B Audiobook Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                📚 Audiobook (MP3)
                {book.audiobook_url && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Generated
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Complete audiobook narration. Same as MP3 narration, saved separately for audiobook apps.
              </p>
              {book.audiobook_generated_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last generated: {new Date(book.audiobook_generated_at).toLocaleString()}
                </p>
              )}
              {book.export_metadata?.audiobook?.voiceName && (
                <p className="text-xs text-gray-600 mt-1">
                  Voice: {book.export_metadata.audiobook.voiceName}
                  {book.export_metadata.audiobook.hasCoverArt && ' • With cover art'}
                </p>
              )}
            </div>
            <div className="ml-4">
              {book.audiobook_url ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleDownloadExisting(book.audiobook_url!, `${book.title}-audiobook.mp3`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full"
                  >
                    Download Audiobook
                  </button>
                  <button
                    onClick={handleExportAudiobook}
                    disabled={audiobookLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium w-full disabled:opacity-50"
                  >
                    {audiobookLoading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleExportAudiobook}
                  disabled={audiobookLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {audiobookLoading ? 'Generating...' : 'Generate Audiobook'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!hasImages && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          ⚠️ Generate images first before exporting. PDF requires images for layout.
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>
          💡 <strong>Tip:</strong> Audio generation uses ElevenLabs AI voices and incurs a small cost (~$0.30 per 1000 characters).
          PDFs are free to generate.
        </p>
      </div>
    </div>
  )
}
