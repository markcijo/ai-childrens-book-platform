import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export type StoryPage = {
  pageNumber: number
  narrationText: string
  sceneDescription: string
  imagePrompt: string
}

export type GeneratedStory = {
  title: string
  pages: StoryPage[]
}

type GenerateStoryInput = {
  storyIdea: string
  title: string
  ageRange: string
  genre: string
  pageCount: number
}

/**
 * Generate a children's story using Claude
 * Breaks the story into pages with scene descriptions and image prompts
 */
export async function generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
  const { storyIdea, title, ageRange, genre, pageCount } = input

  // Build age-appropriate guidelines
  const ageGuidelines = getAgeGuidelines(ageRange)
  
  // Create the system prompt
  const systemPrompt = `You are a professional children's book author and illustrator coordinator. Your task is to create age-appropriate, engaging stories for children.

Key requirements:
- Use ${ageGuidelines.vocabulary} vocabulary
- Sentence length: ${ageGuidelines.sentenceLength}
- Reading level: ${ageGuidelines.readingLevel}
- Themes: ${ageGuidelines.themes}
- Tone: warm, positive, and encouraging
- Length: exactly ${pageCount} pages

For each page you must provide:
1. Narration text (the story text to be read aloud)
2. Scene description (visual description of what's happening)
3. Image prompt (detailed prompt for AI image generation - describe characters, setting, actions, mood, and art style)

CRITICAL: Your response MUST be valid JSON only. No additional text, markdown, or explanations. Just the JSON object.`

  const userPrompt = `Create a children's book with the following details:

Title: ${title}
Genre: ${genre}
Age Range: ${ageRange}
Number of Pages: ${pageCount}
Story Idea: ${storyIdea}

Please generate EXACTLY ${pageCount} pages. Each page should advance the story naturally.

Return your response as a JSON object with this exact structure:
{
  "title": "${title}",
  "pages": [
    {
      "pageNumber": 1,
      "narrationText": "The story text for page 1...",
      "sceneDescription": "Description of the scene...",
      "imagePrompt": "Detailed image generation prompt with character descriptions, setting, actions, art style..."
    }
  ]
}

Art style for image prompts: Use "children's book illustration, warm colors, friendly characters, whimsical style" as the base style.

Generate the complete story now:`

  try {
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract the text content
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    let jsonText = content.text.trim()
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
    
    const generatedStory = JSON.parse(jsonText) as GeneratedStory

    // Validate the response
    if (!generatedStory.pages || generatedStory.pages.length !== pageCount) {
      throw new Error(`Expected ${pageCount} pages, got ${generatedStory.pages?.length || 0}`)
    }

    // Ensure all pages have required fields
    generatedStory.pages.forEach((page, index) => {
      if (!page.narrationText || !page.sceneDescription || !page.imagePrompt) {
        throw new Error(`Page ${index + 1} is missing required fields`)
      }
      // Ensure page numbers are sequential
      page.pageNumber = index + 1
    })

    return generatedStory
  } catch (error) {
    console.error('Story generation error:', error)
    throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get age-appropriate guidelines for story generation
 */
function getAgeGuidelines(ageRange: string) {
  const guidelines: Record<string, {
    vocabulary: string
    sentenceLength: string
    readingLevel: string
    themes: string
  }> = {
    '3-5': {
      vocabulary: 'simple, concrete words (200-500 word vocabulary)',
      sentenceLength: '3-8 words per sentence',
      readingLevel: 'pre-reader to early reader',
      themes: 'daily routines, emotions, friendship, family, animals, imagination',
    },
    '6-8': {
      vocabulary: 'elementary level (500-2000 word vocabulary)',
      sentenceLength: '8-12 words per sentence',
      readingLevel: 'early reader to developing reader',
      themes: 'adventure, problem-solving, kindness, courage, school, nature, simple mysteries',
    },
    '9-12': {
      vocabulary: 'intermediate level (2000-5000 word vocabulary)',
      sentenceLength: '12-20 words per sentence',
      readingLevel: 'confident reader',
      themes: 'complex adventures, moral dilemmas, friendship dynamics, self-discovery, challenges',
    },
    '13+': {
      vocabulary: 'advanced vocabulary',
      sentenceLength: '15-25 words per sentence',
      readingLevel: 'advanced reader',
      themes: 'coming of age, identity, complex relationships, social issues, deeper moral questions',
    },
  }

  return guidelines[ageRange] || guidelines['6-8'] // Default to 6-8
}
