import { useState, useEffect, useCallback } from 'react'
import { useShaderRenderer } from '../../hooks/useShaderRenderer'
import { ShaderParameter } from '../../types'
import { ControlPanel } from './ControlPanel'

interface ShaderViewProps {
  fragmentShader: string
  vertexShader: string
  parameters: ShaderParameter[]
  onParameterChange: (name: string, value: any) => void
  onAddParameter: (name: string, type: 'float' | 'int' | 'bool' | 'color', defaultValue: any) => void
  onRemoveParameter: (name: string) => void
  onSaveScreenshot: (dataUrl: string) => void
}

export const ShaderView = ({
  fragmentShader,
  vertexShader,
  parameters,
  onParameterChange,
  onAddParameter,
  onRemoveParameter,
  onSaveScreenshot
}: ShaderViewProps) => {
  const {
    containerRef,
    isPlaying,
    error,
    setShaders,
    setParameters,
    play,
    pause,
    takeScreenshot
  } = useShaderRenderer()
  
  const [compilationError, setCompilationError] = useState<string | null>(null)
  
  // Safely apply shaders without crashing the app
  const applyShaders = useCallback(() => {
    if (!vertexShader || !fragmentShader) return;
    
    try {
      setCompilationError(null)
      const success = setShaders(vertexShader, fragmentShader)
      
      if (!success && error) {
        setCompilationError(error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setCompilationError(errorMessage)
      console.error('Error applying shaders:', errorMessage)
    }
  }, [vertexShader, fragmentShader, setShaders, error])
  
  // Apply shaders when they change
  useEffect(() => {
    applyShaders()
  }, [applyShaders])
  
  // Update parameters when they change
  useEffect(() => {
    try {
      setParameters(parameters)
    } catch (err) {
      console.error('Error setting parameters:', err)
    }
  }, [parameters, setParameters])
  
  // Update error message when renderer error changes
  useEffect(() => {
    if (error) {
      setCompilationError(error)
    }
  }, [error])
  
  const handlePlayPause = () => {
    try {
      if (isPlaying) {
        pause()
      } else {
        play()
      }
    } catch (err) {
      console.error('Error toggling playback:', err)
    }
  }
  
  const handleTakeScreenshot = () => {
    try {
      const dataUrl = takeScreenshot()
      if (dataUrl) {
        onSaveScreenshot(dataUrl)
      }
    } catch (err) {
      console.error('Error taking screenshot:', err)
    }
  }
  
  // Help text for the user about available uniforms
  const renderHelpInfo = () => (
    <div style={{ 
      position: 'absolute',
      top: 10,
      right: 10,
      padding: '8px 12px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      fontSize: '12px',
      borderRadius: '4px',
      zIndex: 10,
      maxWidth: '300px',
      opacity: 0.7
    }}>
      <p><strong>Available uniforms:</strong></p>
      <p>time: float - Animation time in seconds</p>
      <p>resolution: vec2 - Canvas width/height</p>
      {parameters.map(param => (
        <p key={param.name}>{param.name}: {param.type} - Custom parameter</p>
      ))}
    </div>
  )
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      width: '100%',
      overflow: 'hidden'
    }}>
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        backgroundColor: '#000', 
        minHeight: 0,
        width: '100%',
        overflow: 'hidden'
      }}>
        <div ref={containerRef} style={{ 
          position: 'absolute', 
          inset: 0,
          width: '100%',
          height: '100%'
        }} />
        
        {renderHelpInfo()}
        
        {compilationError && (
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            backgroundColor: 'var(--accent-red)', 
            color: 'white', 
            padding: '1rem', 
            overflowY: 'auto',
            maxHeight: '33%',
            zIndex: 10
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Shader Error</h3>
            <pre style={{ opacity: 0.9, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{compilationError}</pre>
          </div>
        )}
      </div>
      
      <div style={{ 
        height: '250px', 
        minHeight: '250px', 
        overflow: 'hidden',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <ControlPanel
          parameters={parameters}
          onParameterChange={onParameterChange}
          onAddParameter={onAddParameter}
          onRemoveParameter={onRemoveParameter}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onTakeScreenshot={handleTakeScreenshot}
        />
      </div>
    </div>
  )
} 