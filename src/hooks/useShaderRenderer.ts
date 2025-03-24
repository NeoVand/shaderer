import { useRef, useEffect, useState, useCallback } from 'react'
import { ShaderRenderer } from '../lib/webgl/shader-renderer'
import { ShaderParameter } from '../types'

export const useShaderRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<ShaderRenderer | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize the renderer
  useEffect(() => {
    // Only initialize once when container is available
    if (!containerRef.current || rendererRef.current) return;
    
    try {
      rendererRef.current = new ShaderRenderer(
        containerRef.current,
        (err) => setError(err.message)
      )
      
      // Force initial render
      const observer = new ResizeObserver(() => {
        if (rendererRef.current) {
          rendererRef.current.handleResize();
          rendererRef.current.render();
        }
      });
      
      observer.observe(containerRef.current);
      
      // Configure initial state
      if (isPlaying) {
        rendererRef.current.play()
      } else {
        rendererRef.current.pause()
      }
      
      // Cleanup function
      return () => {
        observer.disconnect();
        if (rendererRef.current) {
          rendererRef.current.destroy()
          rendererRef.current = null
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize renderer')
    }
  }, []) // Empty dependency array - only run on mount
  
  // Handle play/pause changes
  useEffect(() => {
    if (!rendererRef.current) return;
    
    try {
      if (isPlaying) {
        rendererRef.current.play()
      } else {
        rendererRef.current.pause()
      }
    } catch (err) {
      console.error('Error updating play state:', err)
    }
  }, [isPlaying]);
  
  // Wrap shader setting in useCallback
  const setShaders = useCallback((vertexShader: string, fragmentShader: string): boolean => {
    if (!rendererRef.current) return false;
    
    setError(null);
    try {
      const success = rendererRef.current.setShaders(vertexShader, fragmentShader);
      rendererRef.current.render(); // Force render after setting shaders
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return false;
    }
  }, []);
  
  // Wrap parameter setting in useCallback
  const setParameters = useCallback((parameters: ShaderParameter[]): void => {
    if (!rendererRef.current) return;
    
    try {
      rendererRef.current.setParameters(parameters);
      rendererRef.current.render(); // Force render after updating parameters
    } catch (err) {
      console.error('Error setting parameters:', err);
    }
  }, []);
  
  // Wrap play in useCallback
  const play = useCallback(() => {
    if (!rendererRef.current) return;
    
    try {
      rendererRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing animation:', err);
    }
  }, []);
  
  // Wrap pause in useCallback
  const pause = useCallback(() => {
    if (!rendererRef.current) return;
    
    try {
      rendererRef.current.pause();
      setIsPlaying(false);
    } catch (err) {
      console.error('Error pausing animation:', err);
    }
  }, []);
  
  // Wrap takeScreenshot in useCallback
  const takeScreenshot = useCallback((): string | null => {
    if (!rendererRef.current) return null;
    
    try {
      return rendererRef.current.takeScreenshot();
    } catch (err) {
      console.error('Error taking screenshot:', err);
      return null;
    }
  }, []);
  
  return {
    containerRef,
    isPlaying,
    error,
    setShaders,
    setParameters,
    play,
    pause,
    takeScreenshot
  }
} 