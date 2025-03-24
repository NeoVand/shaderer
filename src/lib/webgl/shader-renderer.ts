import * as THREE from 'three'
import { ShaderParameter } from '../../types'

// Default fallback shaders (used when compilation fails)
const FALLBACK_VERTEX_SHADER = `void main() {
  gl_Position = vec4(position, 1.0);
}`

const FALLBACK_FRAGMENT_SHADER = `precision mediump float;
uniform vec2 resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  gl_FragColor = vec4(uv.x, 0.1, uv.y, 1.0); // Error gradient
}`

export class ShaderRenderer {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private mesh: THREE.Mesh
  private material: THREE.ShaderMaterial
  private clock: THREE.Clock
  private animationFrameId: number | null = null
  private isPlaying = true
  private onError: (error: Error) => void
  private parameters: Record<string, any> = {}
  private lastValidVertexShader: string = FALLBACK_VERTEX_SHADER
  private lastValidFragmentShader: string = FALLBACK_FRAGMENT_SHADER

  constructor(container: HTMLElement, onError: (error: Error) => void) {
    this.onError = onError
    
    // Create scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#000000')
    
    // Create camera
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    this.camera.position.z = 1
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true 
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)
    
    // Create shader material with fallback shaders initially
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) }
      },
      vertexShader: this.lastValidVertexShader,
      fragmentShader: this.lastValidFragmentShader
    })
    
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2)
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)
    
    // Setup clock
    this.clock = new THREE.Clock()
    
    // Handle resize
    window.addEventListener('resize', this.handleResize)
    
    // Initial resize
    this.handleResize()
    
    // Render once immediately
    this.render()
    
    // Start animation loop
    this.animate()
  }
  
  public handleResize = () => {
    const container = this.renderer.domElement.parentElement
    if (!container) return
    
    const width = container.clientWidth
    const height = container.clientHeight
    
    this.renderer.setSize(width, height)
    if (this.material.uniforms.resolution) {
      this.material.uniforms.resolution.value.set(width, height)
    }
  }
  
  public render() {
    try {
      this.renderer.render(this.scene, this.camera)
    } catch (err) {
      console.error('Render error:', err)
      // Don't propagate the error - we want to avoid crashes
    }
  }
  
  // Check if shader code has a main function (minimum requirement)
  private validateShaderCode(code: string): boolean {
    if (!code) return false;
    return code.includes('main') && code.includes('{') && code.includes('}');
  }
  
  // Try to compile shaders without crashing the app
  public setShaders(vertexShader: string, fragmentShader: string) {
    try {
      // Basic validation first
      if (!this.validateShaderCode(vertexShader)) {
        this.onError(new Error('Vertex shader must contain a main function'));
        return false;
      }
      
      if (!this.validateShaderCode(fragmentShader)) {
        this.onError(new Error('Fragment shader must contain a main function'));
        return false;
      }
    
      // Create new material with updated shaders
      const newMaterial = new THREE.ShaderMaterial({
        uniforms: {
          ...this.material.uniforms,
          ...this.createUniforms(this.parameters)
        },
        vertexShader,
        fragmentShader
      })
      
      // Test compilation with a temporary renderer
      try {
        const testRenderer = new THREE.WebGLRenderer({ antialias: false })
        const testScene = new THREE.Scene()
        const testMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), newMaterial)
        testScene.add(testMesh)
        testRenderer.render(testScene, this.camera)
        testRenderer.dispose()
        
        // If we got here, shaders are valid
        this.material = newMaterial
        this.mesh.material = this.material
        
        // Save these as the last valid shaders
        this.lastValidVertexShader = vertexShader
        this.lastValidFragmentShader = fragmentShader
        
        // Render with the new shaders
        this.render();
        return true
      } catch (compileError: unknown) {
        // Compilation failed, use fallback or last valid shaders
        const errorMessage = compileError instanceof Error 
          ? compileError.message 
          : 'Unknown shader compilation error';
        
        this.onError(new Error(`Shader compilation error: ${errorMessage}`));
        
        // If we have valid previous shaders, use those instead of fallbacks
        const fallbackMaterial = new THREE.ShaderMaterial({
          uniforms: {
            ...this.material.uniforms,
            ...this.createUniforms(this.parameters)
          },
          vertexShader: this.lastValidVertexShader,
          fragmentShader: this.lastValidFragmentShader
        })
        
        this.material = fallbackMaterial
        this.mesh.material = this.material
        
        // Still render so the app doesn't appear broken
        this.render()
        return false
      }
    } catch (err) {
      // Catch any other errors to prevent app crashes
      this.onError(err instanceof Error ? err : new Error('Shader error: ' + String(err)))
      return false
    }
  }

  private createUniforms(parameters: Record<string, any>) {
    const uniforms: Record<string, { value: any }> = {}
    
    Object.entries(parameters).forEach(([name, value]) => {
      if (typeof value === 'number' || typeof value === 'boolean') {
        uniforms[name] = { value }
      } else if (Array.isArray(value) && value.length >= 3) {
        // Handle color values
        uniforms[name] = { value: new THREE.Color(value[0], value[1], value[2]) }
      } else if (Array.isArray(value) && value.length === 2) {
        // Handle vec2 values
        uniforms[name] = { value: new THREE.Vector2(value[0], value[1]) }
      }
    })
    
    return uniforms
  }
  
  public setParameters(params: ShaderParameter[]) {
    try {
      this.parameters = params.reduce((obj, param) => {
        obj[param.name] = param.value
        return obj
      }, {} as Record<string, any>)
      
      // Update uniforms
      const uniforms = this.createUniforms(this.parameters)
      Object.entries(uniforms).forEach(([name, uniform]) => {
        if (!this.material.uniforms[name]) {
          this.material.uniforms[name] = uniform
        } else {
          this.material.uniforms[name].value = uniform.value
        }
      })
      
      // Render immediately after parameter update
      this.render();
    } catch (err) {
      console.error('Error setting parameters:', err)
      // Don't propagate the error to prevent crashes
    }
  }
  
  public play() {
    if (this.isPlaying) return
    
    this.isPlaying = true
    this.clock.start()
    this.animate()
  }
  
  public pause() {
    if (!this.isPlaying) return
    
    this.isPlaying = false
    this.clock.stop()
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
  
  private animate = () => {
    if (!this.isPlaying) return
    
    try {
      this.animationFrameId = requestAnimationFrame(this.animate)
      
      // Update time uniform
      if (this.material.uniforms.time) {
        this.material.uniforms.time.value = this.clock.getElapsedTime()
      }
      
      // Render
      this.render();
    } catch (err) {
      console.error('Animation error:', err)
      // Continue animation even if there was an error
      this.animationFrameId = requestAnimationFrame(this.animate)
    }
  }
  
  public takeScreenshot(): string {
    // Render
    this.render();
    
    try {
      // Get data URL
      return this.renderer.domElement.toDataURL('image/png')
    } catch (err) {
      console.error('Screenshot error:', err)
      return ''
    }
  }
  
  public destroy() {
    // Stop animation
    this.pause()
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    
    try {
      // Dispose Three.js objects
      this.material.dispose()
      this.mesh.geometry.dispose()
      this.renderer.dispose()
      
      // Remove canvas
      const container = this.renderer.domElement.parentElement
      if (container) {
        container.removeChild(this.renderer.domElement)
      }
    } catch (err) {
      console.error('Error during cleanup:', err)
      // Don't propagate cleanup errors
    }
  }
} 