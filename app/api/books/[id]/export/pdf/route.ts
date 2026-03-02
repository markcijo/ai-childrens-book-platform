/**
 * PDF Export API Endpoint
 * 
 * POST /api/books/[id]/export/pdf
 * Generates a PDF export of the book with all pages and images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateBookPDF, generatePDFFilename, type PDFGenerationOptions } from '@/lib/services/pdf-generator'
import { uploadToStorage } from '@/lib/services/storage'
import type { Book, Page } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await context.params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const options: PDFGenerationOptions = {
      layout: body.layout || 'image-top',
      fontSize: body.fontSize || 14,
      includePageNumbers: body.includePageNumbers !== false,
      includeCover: body.includeCover !== false,
    }

    // Fetch book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Fetch pages
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })

    if (pagesError || !pages || pages.length === 0) {
      return NextResponse.json(
        { error: 'No pages found for this book' },
        { status: 400 }
      )
    }

    // Check if all pages have images
    const pagesWithoutImages = pages.filter(
      (p: Page) => !p.permanent_image_url && !p.image_url
    )
    if (pagesWithoutImages.length > 0) {
      return NextResponse.json(
        {
          error: 'Some pages are missing images. Generate images first.',
          missingPages: pagesWithoutImages.map((p: Page) => p.page_number),
        },
        { status: 400 }
      )
    }

    // Generate PDF
    console.log(`Generating PDF for book ${bookId}...`)
    const pdfBuffer = await generateBookPDF(book as Book, pages as Page[], options)

    // Upload to storage
    const filename = generatePDFFilename(book as Book)
    const pdfPath = `${user.id}/${bookId}/exports/${filename}`
    const pdfUrl = await uploadToStorage(pdfBuffer, pdfPath, 'application/pdf')

    // Update book with PDF URL
    const { error: updateError } = await supabase
      .from('books')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
        export_metadata: {
          ...(book.export_metadata || {}),
          pdf: {
            layout: options.layout,
            fontSize: options.fontSize,
            includePageNumbers: options.includePageNumbers,
            includeCover: options.includeCover,
            generatedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', bookId)

    if (updateError) {
      console.error('Failed to update book with PDF URL:', updateError)
      // Continue anyway - the PDF was generated successfully
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      filename,
      message: 'PDF generated successfully',
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/books/[id]/export/pdf
 * Returns the URL of the existing PDF or generates a new one
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await context.params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('pdf_url, pdf_generated_at')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.pdf_url) {
      return NextResponse.json({
        exists: true,
        pdfUrl: book.pdf_url,
        generatedAt: book.pdf_generated_at,
      })
    } else {
      return NextResponse.json({
        exists: false,
        message: 'PDF has not been generated yet',
      })
    }
  } catch (error) {
    console.error('PDF check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check PDF status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
