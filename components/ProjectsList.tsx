'use client'

import { Project } from '@/lib/types/database'
import { useState } from 'react'

export default function ProjectsList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects] = useState<Project[]>(initialProjects)

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-600">
          Create your first project to start making children's books!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  // TODO: Navigate to project detail page
                  console.log('View project:', project.id)
                }}
              >
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
