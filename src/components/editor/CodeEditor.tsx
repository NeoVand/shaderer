import { useRef, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  language: 'glsl' | 'javascript' | 'typescript'
  onChange: (value: string) => void
  height?: string
  theme?: string
}

// Declare global types for Monaco
declare global {
  interface Window {
    monaco: any
  }
}

export const CodeEditor = ({
  value,
  language,
  onChange,
  height = '100%',
  theme = 'vs-dark'
}: CodeEditorProps) => {
  const editorRef = useRef<any>(null)
  
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    
    // Configure editor
    editor.updateOptions({
      tabSize: 2,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14
    })
    
    // Focus editor
    editor.focus()
  }
  
  useEffect(() => {
    // Register GLSL language if not already registered
    if (language === 'glsl') {
      const monaco = window.monaco
      if (monaco && !monaco.languages.getLanguages().some((lang: any) => lang.id === 'glsl')) {
        monaco.languages.register({ id: 'glsl' })
        
        monaco.languages.setMonarchTokensProvider('glsl', {
          tokenizer: {
            root: [
              // Keywords
              [/\b(attribute|const|uniform|varying|break|continue|do|for|while|if|else|in|out|inout|float|int|void|bool|true|false|lowp|mediump|highp|precision|invariant|discard|return|mat2|mat3|mat4|vec2|vec3|vec4|ivec2|ivec3|ivec4|bvec2|bvec3|bvec4|sampler2D|samplerCube|struct)\b/, 'keyword'],
              
              // Functions
              [/\b(gl_Position|gl_PointSize|gl_FragCoord|gl_FrontFacing|gl_FragColor|gl_FragData|gl_VertexID|gl_InstanceID|gl_FragDepth)\b/, 'predefined'],
              
              // Functions
              [/\b(abs|acos|asin|atan|ceil|clamp|cos|cross|degrees|dFdx|dFdy|distance|dot|equal|exp|exp2|faceforward|floor|fract|greaterThan|greaterThanEqual|inversesqrt|length|lessThan|lessThanEqual|log|log2|matrixCompMult|max|min|mix|mod|normalize|not|notEqual|pow|radians|reflect|refract|sign|sin|smoothstep|sqrt|step|tan|texture2D|texture2DLod|texture2DProj|texture2DProjLod|textureCube|textureCubeLod)\b/, 'function'],
              
              // Numbers
              [/\b[0-9]+\.[0-9]*\b/, 'number'],
              [/\b[0-9]+\b/, 'number'],
              
              // Comments
              [/\/\/.*$/, 'comment'],
              [/\/\*/, 'comment', '@comment'],
              
              // Other
              [/[{}\[\]()]/, '@brackets'],
              [/[<>=%&+\-*/^|.,:;]/, 'delimiter']
            ],
            comment: [
              [/[^/*]+/, 'comment'],
              [/\*\//, 'comment', '@pop'],
              [/[/*]/, 'comment']
            ]
          }
        })
      }
    }
  }, [language])
  
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={theme}
      onChange={(value) => onChange(value || '')}
      onMount={handleEditorDidMount}
      options={{
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 2,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8
        }
      }}
    />
  )
} 