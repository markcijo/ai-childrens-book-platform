import Replicate from 'replicate'

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export type GenerateImageInput = {
  prompt: string
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  outputFormat?: 'webp' | 'jpg' | 'png'
  outputQuality?: number // 0-100
  seed?: number // For reproducibility
  referenceImage?: string // URL of reference image for character consistency
  referenceStrength?: number // 0-1, how strongly to follow reference (0.5 default)
}

export type GenerateImageOutput = {
  url: string
  width: number
  height: number
  seed?: number
}

/**
 * Generate an image using Replicate's FLUX model
 * FLUX.1 [schnell] is optimized for speed (1-4 steps) while maintaining quality
 * Supports character reference images for consistency
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const {
    prompt,
    aspectRatio = '1:1',
    outputFormat = 'webp',
    outputQuality = 90,
    seed,
    referenceImage,
    referenceStrength = 0.5,
  } = input

  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not set in environment variables')
  }

  try {
    // Choose model based on whether we need img2img for character consistency
    if (referenceImage) {
      // Use FLUX dev with img2img for character consistency
      // This allows us to maintain character appearance across pages
      const output = await replicate.run(
        "black-forest-labs/flux-dev",
        {
          input: {
            prompt: enhancePromptForChildrensBook(prompt),
            image: referenceImage,
            prompt_strength: referenceStrength,
            aspect_ratio: aspectRatio,
            output_format: outputFormat,
            output_quality: outputQuality,
            num_outputs: 1,
            ...(seed && { seed }),
          }
        }
      ) as unknown

      const outputArray = output as string[]
      if (!outputArray || outputArray.length === 0) {
        throw new Error('No image generated from Replicate')
      }

      const imageUrl = outputArray[0]
      const dimensions = getAspectRatioDimensions(aspectRatio)

      return {
        url: imageUrl,
        width: dimensions.width,
        height: dimensions.height,
        seed,
      }
    } else {
      // Use FLUX.1 [schnell] - fast, high-quality image generation for initial pages
      // Documentation: https://replicate.com/black-forest-labs/flux-schnell
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: enhancePromptForChildrensBook(prompt),
            aspect_ratio: aspectRatio,
            output_format: outputFormat,
            output_quality: outputQuality,
            num_outputs: 1,
            ...(seed && { seed }),
          }
        }
      ) as unknown

      const outputArray = output as string[]
      
      if (!outputArray || outputArray.length === 0) {
        throw new Error('No image generated from Replicate')
      }

      const imageUrl = outputArray[0]
      const dimensions = getAspectRatioDimensions(aspectRatio)

      return {
        url: imageUrl,
        width: dimensions.width,
        height: dimensions.height,
        seed,
      }
    }
  } catch (error) {
    console.error('Image generation error:', error)
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Enhance the image prompt with children's book styling
 * This ensures consistent, child-appropriate, professional-looking illustrations
 */
function enhancePromptForChildrensBook(originalPrompt: string): string {
  // Add consistent styling directives for children's book illustrations
  const stylePrefix = "Children's book illustration, professional digital art, vibrant colors, friendly and inviting style, detailed but not cluttered, soft lighting, whimsical and warm atmosphere."
  
  // Combine with original prompt
  return `${stylePrefix} ${originalPrompt}`
}

/**
 * Get pixel dimensions for common aspect ratios
 * FLUX models work best with dimensions that are multiples of 32
 */
function getAspectRatioDimensions(aspectRatio: string): { width: number; height: number } {
  const dimensionsMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1344, height: 768 },
    '9:16': { width: 768, height: 1344 },
    '4:3': { width: 1152, height: 896 },
    '3:4': { width: 896, height: 1152 },
  }
  
  return dimensionsMap[aspectRatio] || dimensionsMap['1:1']
}

/**
 * Generate images for multiple pages sequentially
 * Sequential to avoid rate limiting issues
 */
export async function generateImagesForPages(
  pages: Array<{ id: string; imagePrompt: string }>,
  onProgress?: (pageId: string, imageUrl: string) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  for (const page of pages) {
    try {
      console.log(`Generating image for page ${page.id}...`)
      
      const result = await generateImage({
        prompt: page.imagePrompt,
        aspectRatio: '1:1', // Square format works best for children's books
        outputFormat: 'webp', // Smaller file size, good quality
        outputQuality: 90,
      })

      results.set(page.id, result.url)
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(page.id, result.url)
      }

      console.log(`✓ Generated image for page ${page.id}`)
      
      // Small delay to respect rate limits (Replicate allows ~50 requests/min)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
    } catch (error) {
      console.error(`Failed to generate image for page ${page.id}:`, error)
      // Continue with other pages even if one fails
      results.set(page.id, '') // Empty string indicates failure
    }
  }

  return results
}

/**
 * Validate that Replicate API token is configured
 */
export function validateReplicateConfig(): { configured: boolean; error?: string } {
  if (!process.env.REPLICATE_API_TOKEN) {
    return {
      configured: false,
      error: 'REPLICATE_API_TOKEN environment variable is not set. Get your token from https://replicate.com/account/api-tokens'
    }
  }
  
  return { configured: true }
}
