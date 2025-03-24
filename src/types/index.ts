import { ShaderProject } from '../lib/db/database'

export type TabType = 'fragment' | 'vertex'

export interface EditorTab {
  id: string
  type: TabType
  label: string
  content: string
}

export interface ShaderParameter {
  name: string
  type: 'float' | 'int' | 'bool' | 'color' | 'vec2' | 'vec3' | 'vec4'
  value: any
  min?: number
  max?: number
  step?: number
}

export interface CurrentProject extends ShaderProject {
  tabs: EditorTab[]
  activeTabId: string | null
  parameters: ShaderParameter[]
  isSaved: boolean
} 