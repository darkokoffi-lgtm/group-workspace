'use client'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'

// --- PART 1: THE FILLING (Your actual page logic) ---
function ProjectContent() {
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [assigneeId, setAssigneeId] = useState('')
  
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  useEffect(() => {
    const getData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error || !projectData) {
        router.push('/dashboard')
      } else {
        setProject(projectData)
      }

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
      if (tasksData) setTasks(tasksData)

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
      if (profilesData) {
        setProfiles(profilesData)
        setAssigneeId(session.user.id) 
      }
             
      const { data: contribData } = await supabase
        .from('contributions')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq('project_id', projectId)
        .order('logged_at', { ascending: false })
      if (contribData) setContributions(contribData)
      
      setLoading(false)
    }
    getData()
  }, [projectId, router, supabase])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || !user) return

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        project_id: projectId, 
        title: newTaskTitle, 
        assignee_id: assigneeId,
        status: 'todo' 
      }])
      .select()

    if (error) {
      alert("Error creating task: " + error.message)
    } else if (data) {
      setTasks([...tasks, data[0]])
      setNewTaskTitle('')
    }
  }

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (error) {
      alert("Error updating task: " + error.message)
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white p-12 text-center">Loading...</div>
  if (!project) return null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* Top Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 px-6 py-4 flex justify-between items-center sticky top-0 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700 text-sm font-medium flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold tracking-tight hidden md:block">{project.name}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">{user?.user_metadata.full_name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <img 
            src={user?.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 md:p-10">
        
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white mb-2 md:hidden">{project.name}</h2>
          <p className="text-gray-400">Manage tasks and track contributions for this workspace.</p>
        </div>
        
        {/* Create Task Form */}
        <div className="mb-12 p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-white">Add a New Task</h3>
          <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="What needs to be done?" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-gray-500"
            />
            
            <select 
              value={assigneeId} 
              onChange={(e) => setAssigneeId(e.target.value)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 text-white cursor-pointer"
            >
              <option value="" disabled>Assign to...</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name || 'Unknown User'}
                </option>
              ))}
            </select>

            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Add Task
            </button>
          </form>
        </div>

        {/* Tasks Board */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 text-white">Tasks Board</h3>
          
          {tasks.length === 0 ? (
            <div className="text-center p-12 bg-gray-900 border border-gray-800 rounded-2xl">
              <p className="text-gray-400">No tasks yet. Create your first task above!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex flex-col md:flex-row justify-between md:items-center p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors gap-4">
                  
                  <div className="flex flex-col">
                    <span className={`text-lg font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                      {task.title}
                    </span>
                    <span className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Assigned to: {profiles.find(p => p.id === task.assignee_id)?.full_name || 'Unknown'}
                    </span>
                  </div>
                  
                  <select 
                    value={task.status} 
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                    disabled={task.assignee_id !== user?.id}
                    className={`px-4 py-2 rounded-lg font-medium cursor-pointer border ${
                      task.assignee_id !== user?.id ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      task.status === 'done' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 
                      task.status === 'in_progress' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' : 
                      'bg-gray-800 text-gray-300 border-gray-700'
                    }`}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contribution Tracking */}
        <div className="pt-8 border-t border-gray-800">
          <h3 className="text-2xl font-bold mb-6 text-amber-400 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Contribution Log
          </h3>
          
          {contributions.length === 0 ? (
            <p className="text-gray-500">No contributions logged yet. Mark a task as "Done" to see it here.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {contributions.map((c) => (
                <div key={c.id} className="p-5 bg-gray-900 border-l-4 border-amber-500 rounded-r-xl shadow-md">
                  <p className="text-gray-300">
                    <strong className="text-white">{c.profiles?.full_name || 'A Student'}</strong> completed a task:
                  </p>
                  <p className="text-lg font-bold text-white mt-1">{c.description}</p>
                  <p className="text-xs text-gray-500 mt-3 font-mono">
                    {new Date(c.logged_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// --- PART 2: THE BREAD (The wrapper that Vercel needs) ---
export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white p-12 text-center">Loading Project...</div>}>
      <ProjectContent />
    </Suspense>
  )
}