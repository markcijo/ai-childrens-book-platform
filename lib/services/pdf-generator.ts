/**
 * PDF Generation Service
 * 
 * Generates professional picture-book style PDFs from book pages.
 * Layout: Full-page images with text overlay or beside image.
 */

import { jsPDF } from 'jspdf'
import type { Book, Page } from '@/lib/types/database'

export interface PDFGenerationOptions {
  layout?: 'image-top' | 'image-full' | 'image-left'
  fontSize?: number
  includePageNumbers?: boolean
  includeCover?: boolean
}

/**
 * Generate a PDF from a book and its pages
 */
export async function generateBookPDF(
  book: Book,
  pages: Page[],
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  const {
    layout = 'image-top',
    fontSize = 14,
    includePageNumbers = true,
    includeCover = true,
  } = options

  // Create PDF in landscape mode (better for children's books)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4', // A4 landscape: 842 x 595 pt
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 40

  let isFirstPage = true

  // Add cover page
  if (includeCover) {
    await addCoverPage(pdf, book, pages[0], pageWidth, pageHeight, margin)
    isFirstPage = false
  }

  // Add content pages
  for (const page of pages) {
    if (!isFirstPage) {
      pdf.addPage()
    }
    isFirstPage = false

    await addContentPage(
      pdf,
      page,
      layout,
      fontSize,
      includePageNumbers,
      pageWidth,
      pageHeight,
      margin
    )
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
  return pdfBuffer
}

/**
 * Add cover page with title and first page image
 */
async function addCoverPage(
  pdf: jsPDF,
  book: Book,
  firstPage: Page | undefined,
  pageWidth: number,
  pageHeight: number,
  margin: number
): Promise<void> {
  // Background color
  pdf.setFillColor(245, 245, 255) // Light blue
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')

  // Title
  pdf.setFontSize(36)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(40, 40, 80)
  
  const titleLines = pdf.splitTextToSize(book.title, pageWidth - 2 * margin)
  const titleY = pageHeight * 0.25
  pdf.text(titleLines, pageWidth / 2, titleY, { align: 'center' })

  // Subtitle (age range, genre)
  if (book.age_range || book.genre) {
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 120)
    
    const subtitle = [book.age_range, book.genre].filter(Boolean).join(' • ')
    pdf.text(subtitle, pageWidth / 2, titleY + 50, { align: 'center' })
  }

  // Cover image (if first page has image)
  if (firstPage?.permanent_image_url || firstPage?.image_url) {
    const imageUrl = firstPage.permanent_image_url || firstPage.image_url
    if (imageUrl) {
      try {
        const imageData = await fetchImageAsBase64(imageUrl)
        const imgWidth = 300
        const imgHeight = 300
        const imgX = (pageWidth - imgWidth) / 2
        const imgY = pageHeight * 0.45
        
        pdf.addImage(imageData, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST')
      } catch (error) {
        console.error('Failed to load cover image:', error)
      }
    }
  }

  // Page count
  pdf.setFontSize(12)
  pdf.setTextColor(120, 120, 140)
  pdf.text(
    `${book.page_count} pages`,
    pageWidth / 2,
    pageHeight - margin,
    { align: 'center' }
  )
}

/**
 * Add content page with image and text
 */
async function addContentPage(
  pdf: jsPDF,
  page: Page,
  layout: 'image-top' | 'image-full' | 'image-left',
  fontSize: number,
  includePageNumbers: boolean,
  pageWidth: number,
  pageHeight: number,
  margin: number
): Promise<void> {
  const imageUrl = page.permanent_image_url || page.image_url

  if (layout === 'image-full') {
    // Full-page image with text overlay at bottom
    if (imageUrl) {
      try {
        const imageData = await fetchImageAsBase64(imageUrl)
        pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST')
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }

    // Text overlay with semi-transparent background
    const textHeight = 120
    pdf.setFillColor(255, 255, 255)
    pdf.setGlobalAlpha(0.9)
    pdf.rect(0, pageHeight - textHeight, pageWidth, textHeight, 'F')
    pdf.setGlobalAlpha(1.0)

    // Add text
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(40, 40, 60)
    const textLines = pdf.splitTextToSize(page.text, pageWidth - 2 * margin)
    pdf.text(textLines, pageWidth / 2, pageHeight - textHeight + 30, { align: 'center' })
  } else if (layout === 'image-top') {
    // Image on top, text below
    const imageHeight = pageHeight * 0.65
    const textAreaHeight = pageHeight - imageHeight - margin

    if (imageUrl) {
      try {
        const imageData = await fetchImageAsBase64(imageUrl)
        const imgWidth = pageWidth - 2 * margin
        const imgHeight = imageHeight - margin
        pdf.addImage(imageData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST')
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }

    // Add text below image
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(40, 40, 60)
    const textLines = pdf.splitTextToSize(page.text, pageWidth - 2 * margin)
    pdf.text(textLines, pageWidth / 2, imageHeight + 30, { align: 'center', maxWidth: pageWidth - 2 * margin })
  } else if (layout === 'image-left') {
    // Image on left, text on right (side-by-side)
    const imageWidth = pageWidth * 0.55
    const textAreaWidth = pageWidth - imageWidth - 3 * margin

    if (imageUrl) {
      try {
        const imageData = await fetchImageAsBase64(imageUrl)
        const imgWidth = imageWidth - margin
        const imgHeight = pageHeight - 2 * margin
        pdf.addImage(imageData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST')
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }

    // Add text on right side
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(40, 40, 60)
    const textLines = pdf.splitTextToSize(page.text, textAreaWidth)
    pdf.text(textLines, imageWidth + margin, margin + 40, { maxWidth: textAreaWidth })
  }

  // Add page number
  if (includePageNumbers) {
    pdf.setFontSize(10)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `${page.page_number}`,
      pageWidth - margin,
      pageHeight - margin / 2,
      { align: 'right' }
    )
  }
}

/**
 * Fetch image and convert to base64 for embedding in PDF
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  
  // Determine image type from URL or content-type
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const imageType = contentType.split('/')[1] || 'jpeg'
  
  return `data:${contentType};base64,${base64}`
}

/**
 * Generate PDF filename from book title
 */
export function generatePDFFilename(book: Book): string {
  const sanitized = book.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  return `${sanitized}.pdf`
}
