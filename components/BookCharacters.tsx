'use client'

/**
 * Book Characters Component
 * 
 * Displays the character bible for a book
 * Shows character details extracted from story and images
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Character {
  id: string
  name: string
  description: string
  reference_image_url: string | null
  permanent_image_url: string | null
  appearance_details: {
    species?: string
    age_appearance?: string
    hair_color?: string
    hair_style?: string
    eye_color?: string
    clothing?: string
    distinctive_features?: string[]
    colors?: string[]
  }
  personality?: string
  role: string
  first_seen_page: number
}

interface BookCharactersProps {
  bookId: string
  autoLoad?: boolean
}

export default function BookCharacters({ bookId, autoLoad = true }: BookCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoLoad) {
      loadCharacters()
    }
  }, [bookId, autoLoad])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/books/${bookId}/extract-characters`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load characters')
      }

      setCharacters(data.characters || [])
    } catch (err) {
      console.error('Load characters error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load characters')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading characters...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
        {error}
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-lg font-medium">No characters extracted yet</p>
        <p className="text-sm mt-2">Extract characters from your book to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Character Bible</h3>
        <span className="text-sm text-gray-500">{characters.length} character(s)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {characters.map((character) => (
          <div
            key={character.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
          >
            {/* Character Image */}
            {(character.permanent_image_url || character.reference_image_url) && (
              <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={character.permanent_image_url || character.reference_image_url || ''}
                  alt={character.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Character Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-2xl font-bold text-gray-900">{character.name}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    character.role === 'main_character'
                      ? 'bg-purple-100 text-purple-700'
                      : character.role === 'supporting'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {character.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-600">First appears: Page {character.first_seen_page}</p>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-4 leading-relaxed">{character.description}</p>

            {/* Appearance Details */}
            {character.appearance_details && (
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Visual Details:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {character.appearance_details.species && (
                    <div>
                      <span className="text-gray-500">Species:</span>{' '}
                      <span className="text-gray-900 font-medium">{character.appearance_details.species}</span>
                    </div>
                  )}
                  {character.appearance_details.age_appearance && (
                    <div>
                      <span className="text-gray-500">Age:</span>{' '}
                      <span className="text-gray-900 font-medium">{character.appearance_details.age_appearance}</span>
                    </div>
                  )}
                  {character.appearance_details.hair_color && (
                    <div>
                      <span className="text-gray-500">Hair:</span>{' '}
                      <span className="text-gray-900 font-medium">
                        {character.appearance_details.hair_color}
                        {character.appearance_details.hair_style && `, ${character.appearance_details.hair_style}`}
                      </span>
                    </div>
                  )}
                  {character.appearance_details.eye_color && (
                    <div>
                      <span className="text-gray-500">Eyes:</span>{' '}
                      <span className="text-gray-900 font-medium">{character.appearance_details.eye_color}</span>
                    </div>
                  )}
                  {character.appearance_details.clothing && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Clothing:</span>{' '}
                      <span className="text-gray-900 font-medium">{character.appearance_details.clothing}</span>
                    </div>
                  )}
                </div>

                {/* Distinctive Features */}
                {character.appearance_details.distinctive_features &&
                  character.appearance_details.distinctive_features.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-500">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {character.appearance_details.distinctive_features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Colors */}
                {character.appearance_details.colors && character.appearance_details.colors.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-500">Color Palette:</span>
                    <div className="flex gap-1 mt-1">
                      {character.appearance_details.colors.map((color, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Personality */}
            {character.personality && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm">
                  <span className="text-gray-500">Personality:</span>{' '}
                  <span className="text-gray-900 italic">{character.personality}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
