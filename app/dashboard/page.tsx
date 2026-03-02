import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsList from '@/components/ProjectsList'
import CreateProjectForm from '@/components/CreateProjectForm'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Fetch user's projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                AI Children's Book Platform
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600">
            Create and manage your children's book projects
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {projectsError ? (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-red-700">Error loading projects: {projectsError.message}</p>
              </div>
            ) : (
              <ProjectsList initialProjects={projects || []} />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
              <CreateProjectForm userId={user.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
