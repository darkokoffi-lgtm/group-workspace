'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [projectName, setProjectName] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      if (data) setProjects(data)
      
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || !user) return

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: projectName, owner_id: user.id }])
      .select()

    if (error) {
      alert("Error creating project: " + error.message)
    } else if (data) {
      setProjects([data[0], ...projects])
      setProjectName('')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white p-12 text-center">Loading...</div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* Top Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 px-6 py-4 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">CS</div>
          <h1 className="text-xl font-bold tracking-tight">Campus Workspace</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">{user.user_metadata.full_name}</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Projects</h2>
            <p className="text-gray-400">Create and manage your group projects to track contributions.</p>
          </div>
        </div>

        {/* Create Project Form */}
        <div className="mb-12 p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">Create a New Project</h3>
          <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="e.g., CS 482: Autonomous Systems Capstone..." 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
            />
            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Create Project
            </button>
          </form>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center p-12 bg-gray-900 border border-gray-800 rounded-2xl">
              <p className="text-gray-400">You have no projects yet. Create your first one above!</p>
            </div>
          ) : (
            projects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => router.push(`/dashboard/project/${project.id}`)}
                className="group cursor-pointer p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-gray-800/50 transition-all shadow-lg hover:shadow-blue-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{project.name}</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">Project ID: {project.id.slice(0, 8)}...</p>
                
                <div className="flex items-center text-sm font-medium text-blue-400">
                  Open Workspace 
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}