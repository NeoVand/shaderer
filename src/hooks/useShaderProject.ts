import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { db, ShaderProject } from '../lib/db/database'
import { CurrentProject, EditorTab } from '../types'

// Default fragment shader for new projects
const DEFAULT_FRAGMENT_SHADER = `// Fragment shader
precision mediump float;

// Built-in uniforms
uniform float time;      // Animation time in seconds
uniform vec2 resolution; // Viewport resolution (width, height)

// Add your custom uniforms here:
// uniform float myParam;  // Example custom parameter

void main() {
  // Normalized coordinates (from 0 to 1)
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  // Create a more vibrant color pattern
  vec3 color = 0.5 + 0.5 * cos(time * 0.5 + uv.xyx * 6.0 + vec3(0.0, 2.0, 4.0));
  
  // Add some circular patterns
  float d = length(uv - 0.5) * 2.0;
  vec3 color2 = vec3(smoothstep(0.5, 0.2, d + sin(time) * 0.2));
  
  // Mix the patterns
  color = mix(color, color2, 0.5);
  
  // Output to screen
  gl_FragColor = vec4(color, 1.0);
}`

// Default vertex shader for new projects
const DEFAULT_VERTEX_SHADER = `void main() {
  // Use existing position attribute from Three.js
  gl_Position = vec4(position, 1.0);
}`

const createNewProject = (): CurrentProject => {
  const fragmentTab: EditorTab = {
    id: uuidv4(),
    type: 'fragment',
    label: 'Fragment Shader',
    content: DEFAULT_FRAGMENT_SHADER
  }
  
  const vertexTab: EditorTab = {
    id: uuidv4(),
    type: 'vertex',
    label: 'Vertex Shader',
    content: DEFAULT_VERTEX_SHADER
  }
  
  return {
    name: 'New Project',
    description: '',
    fragmentShader: DEFAULT_FRAGMENT_SHADER,
    vertexShader: DEFAULT_VERTEX_SHADER,
    created: new Date(),
    updated: new Date(),
    tabs: [fragmentTab, vertexTab],
    activeTabId: fragmentTab.id,
    parameters: [],
    isSaved: false
  }
}

export const useShaderProject = (projectId?: string) => {
  const [project, setProject] = useState<CurrentProject>(createNewProject())
  const [isLoading, setIsLoading] = useState(projectId !== undefined)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setProject(createNewProject())
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const loadedProject = await db.getProject(projectId)
        
        if (!loadedProject) {
          throw new Error(`Project with id ${projectId} not found`)
        }
        
        const fragmentTab: EditorTab = {
          id: uuidv4(),
          type: 'fragment',
          label: 'Fragment Shader',
          content: loadedProject.fragmentShader
        }
        
        const vertexTab: EditorTab = {
          id: uuidv4(),
          type: 'vertex',
          label: 'Vertex Shader',
          content: loadedProject.vertexShader || DEFAULT_VERTEX_SHADER
        }
        
        const currentProject: CurrentProject = {
          ...loadedProject,
          vertexShader: loadedProject.vertexShader || DEFAULT_VERTEX_SHADER,
          tabs: [fragmentTab, vertexTab],
          activeTabId: fragmentTab.id,
          parameters: loadedProject.parameters ? Object.entries(loadedProject.parameters).map(([name, value]) => ({
            name,
            type: typeof value === 'number' ? 'float' : (typeof value === 'boolean' ? 'bool' : 'color'),
            value
          })) : [],
          isSaved: true
        }
        
        setProject(currentProject)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load project'))
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProject()
  }, [projectId])
  
  const switchTab = (tabId: string) => {
    setProject(prev => ({
      ...prev,
      activeTabId: tabId
    }))
  }
  
  const updateTabContent = (tabId: string, content: string) => {
    setProject(prev => {
      const updatedTabs = prev.tabs.map(tab => 
        tab.id === tabId ? { ...tab, content } : tab
      )
      
      const updatedTab = updatedTabs.find(tab => tab.id === tabId)
      
      if (!updatedTab) return prev
      
      // Update the corresponding shader content
      const updates: Partial<CurrentProject> = {
        tabs: updatedTabs,
        isSaved: false
      }
      
      if (updatedTab.type === 'fragment') {
        updates.fragmentShader = content
      } else if (updatedTab.type === 'vertex') {
        updates.vertexShader = content
      }
      
      return { ...prev, ...updates }
    })
  }

  const saveProject = async () => {
    try {
      const { tabs, activeTabId, isSaved, ...projectData } = project
      
      if (projectData.id) {
        await db.updateProject(projectData.id, projectData)
      } else {
        const id = await db.addProject(projectData)
        setProject(prev => ({
          ...prev,
          id: typeof id === 'string' ? id : undefined,
          isSaved: true
        }))
        return id
      }
      
      setProject(prev => ({ ...prev, isSaved: true }))
      return projectData.id
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save project'))
      throw err
    }
  }
  
  const updateProjectInfo = (updates: Partial<Pick<ShaderProject, 'name' | 'description' | 'thumbnail'>>) => {
    setProject(prev => ({
      ...prev,
      ...updates,
      isSaved: false
    }))
  }
  
  const updateParameter = (name: string, value: any) => {
    setProject(prev => {
      const updatedParameters = prev.parameters.map(param => 
        param.name === name ? { ...param, value } : param
      )
      
      return {
        ...prev,
        parameters: updatedParameters,
        isSaved: false
      }
    })
  }
  
  const addParameter = (name: string, type: 'float' | 'int' | 'bool' | 'color', defaultValue: any) => {
    setProject(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { name, type, value: defaultValue }
      ],
      isSaved: false
    }))
  }
  
  const removeParameter = (name: string) => {
    setProject(prev => ({
      ...prev,
      parameters: prev.parameters.filter(param => param.name !== name),
      isSaved: false
    }))
  }
  
  return {
    project,
    isLoading,
    error,
    switchTab,
    updateTabContent,
    saveProject,
    updateProjectInfo,
    updateParameter,
    addParameter,
    removeParameter
  }
} 