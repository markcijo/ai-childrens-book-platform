/**
 * Permanent image storage service using Cloudflare R2 (S3-compatible)
 * 
 * Stores generated images permanently to avoid Replicate URL expiration.
 * Images are organized by user_id/book_id/page_number for easy management.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

// R2 configuration from environment
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ai-childrens-books';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: custom domain for R2

// Initialize S3 client for R2
const getR2Client = () => {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
};

/**
 * Upload image from URL to R2
 * 
 * @param imageUrl - Source image URL (e.g., Replicate temporary URL)
 * @param userId - User ID for organization
 * @param bookId - Book ID for organization
 * @param fileName - File name (e.g., "page-1.webp" or "character-luna.webp")
 * @returns Public URL of uploaded image
 */
export async function uploadImageToR2(
  imageUrl: string,
  userId: string,
  bookId: string,
  fileName: string
): Promise<string> {
  try {
    // Fetch the image from the source URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/webp';

    // Upload to R2
    const key = `${userId}/${bookId}/${fileName}`;
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(imageBuffer),
        ContentType: contentType,
        // Make publicly accessible
        // Note: You may need to configure bucket policy for public access
      })
    );

    // Generate public URL
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

/**
 * Upload character reference image
 * 
 * @param imageUrl - Source image URL
 * @param userId - User ID
 * @param bookId - Book ID
 * @param characterName - Character name for file naming
 * @returns Public URL of uploaded character image
 */
export async function uploadCharacterImage(
  imageUrl: string,
  userId: string,
  bookId: string,
  characterName: string
): Promise<string> {
  // Sanitize character name for file system
  const safeName = characterName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const fileName = `character-${safeName}.webp`;
  return uploadImageToR2(imageUrl, userId, bookId, fileName);
}

/**
 * Upload page image
 * 
 * @param imageUrl - Source image URL
 * @param userId - User ID
 * @param bookId - Book ID
 * @param pageNumber - Page number
 * @returns Public URL of uploaded page image
 */
export async function uploadPageImage(
  imageUrl: string,
  userId: string,
  bookId: string,
  pageNumber: number
): Promise<string> {
  const fileName = `page-${pageNumber}.webp`;
  return uploadImageToR2(imageUrl, userId, bookId, fileName);
}

/**
 * Delete image from R2
 * 
 * @param userId - User ID
 * @param bookId - Book ID
 * @param fileName - File name to delete
 */
export async function deleteImageFromR2(
  userId: string,
  bookId: string,
  fileName: string
): Promise<void> {
  try {
    const key = `${userId}/${bookId}/${fileName}`;
    const client = getR2Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error('Error deleting from R2:', error);
    throw error;
  }
}

/**
 * Check if image exists in R2
 * 
 * @param userId - User ID
 * @param bookId - Book ID
 * @param fileName - File name to check
 * @returns true if image exists
 */
export async function imageExistsInR2(
  userId: string,
  bookId: string,
  fileName: string
): Promise<boolean> {
  try {
    const key = `${userId}/${bookId}/${fileName}`;
    const client = getR2Client();

    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * Upload any buffer (PDF, audio, etc.) to R2 storage
 * 
 * @param buffer - File buffer to upload
 * @param key - S3 key/path (e.g., "user_id/book_id/exports/file.pdf")
 * @param contentType - MIME type (e.g., "application/pdf", "audio/mpeg")
 * @returns Public URL of uploaded file
 */
export async function uploadToStorage(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // Generate public URL
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading to storage:', error);
    throw error;
  }
}
