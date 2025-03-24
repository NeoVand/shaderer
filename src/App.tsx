import { useState } from 'react'
import Split from 'react-split'
import { useShaderProject } from './hooks/useShaderProject'
import { Header } from './components/ui/Header'
import { EditorPanel } from './components/editor/EditorPanel'
import { ShaderView } from './components/shader/ShaderView'
import { Gallery } from './components/ui/Gallery'
import './App.css'

function App() {
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [showGallery, setShowGallery] = useState(false)
  
  const {
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
  } = useShaderProject(projectId)
  
  const handleSaveProject = async () => {
    try {
      const id = await saveProject()
      if (id && !projectId) {
        setProjectId(typeof id === 'string' ? id : undefined)
      }
      
      // Update thumbnail if there's a renderer available
      const shaderCanvas = document.querySelector('canvas')
      if (shaderCanvas) {
        const thumbnail = shaderCanvas.toDataURL('image/png')
        updateProjectInfo({ thumbnail })
      }
    } catch (err) {
      console.error('Failed to save project', err)
    }
  }
  
  const handleNewProject = () => {
    if (!project.isSaved && confirm('You have unsaved changes. Create a new project anyway?')) {
      setProjectId(undefined)
    } else if (project.isSaved) {
      setProjectId(undefined)
    }
  }
  
  const handleOpenGallery = () => {
    setShowGallery(true)
  }
  
  const handleSelectProject = (id: string) => {
    setProjectId(id)
    setShowGallery(false)
  }
  
  const handleSaveScreenshot = (dataUrl: string) => {
    // Save as thumbnail and project data
    updateProjectInfo({ thumbnail: dataUrl })
    
    // Also trigger a save
    handleSaveProject()
    
    // Optionally, provide a download link
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${project.name || 'shader'}.png`
    a.click()
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="loading-pulse">Loading...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="bg-red-900 p-4 rounded">Error: {error.message}</div>
      </div>
    )
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <Header
        projectName={project.name}
        onSave={handleSaveProject}
        onNew={handleNewProject}
        onOpenGallery={handleOpenGallery}
        onChangeName={(name) => updateProjectInfo({ name })}
        isSaved={project.isSaved}
      />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%' }}>
        <Split 
          sizes={[50, 50]}
          minSize={300}
          gutterSize={10}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          className="split-container"
          style={{ 
            display: 'flex', 
            flexDirection: 'row',
            width: '100%',
            height: '100%'
          }}
        >
          <div style={{ 
            height: '100%', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <EditorPanel
              tabs={project.tabs}
              activeTabId={project.activeTabId}
              onTabChange={switchTab}
              onCodeChange={updateTabContent}
            />
          </div>
          
          <div style={{ 
            height: '100%', 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <ShaderView
              fragmentShader={project.fragmentShader}
              vertexShader={project.vertexShader || ''}
              parameters={project.parameters}
              onParameterChange={updateParameter}
              onAddParameter={addParameter}
              onRemoveParameter={removeParameter}
              onSaveScreenshot={handleSaveScreenshot}
            />
          </div>
        </Split>
      </div>
      
      {showGallery && (
        <Gallery
          onSelectProject={handleSelectProject}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  )
}

export default App
