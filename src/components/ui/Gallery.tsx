import { useState, useEffect } from 'react'
import { db, ShaderProject } from '../../lib/db/database'

interface GalleryProps {
  onSelectProject: (projectId: string) => void
  onClose: () => void
}

export const Gallery = ({ onSelectProject, onClose }: GalleryProps) => {
  const [projects, setProjects] = useState<ShaderProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const loadedProjects = await db.getProjects()
        setProjects(loadedProjects)
      } catch (err) {
        setError('Failed to load projects')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProjects()
  }, [])
  
  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!projectId) return
    
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await db.deleteProject(projectId)
        setProjects(projects.filter(project => project.id !== projectId))
      } catch (err) {
        setError('Failed to delete project')
      }
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Project Gallery</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-auto max-h-[calc(80vh-70px)]">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Loading projects...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : projects.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No projects found. Create a new project to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => project.id && onSelectProject(project.id)}
                  className="bg-gray-800 rounded-lg overflow-hidden shadow hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                >
                  <div className="aspect-video bg-black relative">
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
                        alt={project.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600">
                        No Preview
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium truncate">{project.name}</h3>
                      <button
                        onClick={(e) => project.id && handleDeleteProject(project.id, e)}
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(project.updated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 