import Dexie, { Table } from 'dexie'
import { v4 as uuidv4 } from 'uuid'

export interface ShaderProject {
  id?: string
  name: string
  description?: string
  fragmentShader: string
  vertexShader?: string
  parameters?: Record<string, any>
  created: Date
  updated: Date
  thumbnail?: string
}

export class ShaderDatabase extends Dexie {
  projects!: Table<ShaderProject>

  constructor() {
    super('ShaderDB')
    this.version(1).stores({
      projects: 'id, name, created, updated'
    })
  }

  async addProject(project: Omit<ShaderProject, 'id' | 'created' | 'updated'>) {
    const now = new Date()
    const id = uuidv4()

    return this.projects.add({
      id,
      ...project,
      created: now,
      updated: now
    })
  }

  async updateProject(id: string, changes: Partial<Omit<ShaderProject, 'id' | 'created'>>) {
    return this.transaction('rw', this.projects, async () => {
      const now = new Date()
      await this.projects.update(id, {
        ...changes,
        updated: now
      })
      return this.projects.get(id)
    })
  }

  async getProjects() {
    return this.projects.orderBy('updated').reverse().toArray()
  }

  async getProject(id: string) {
    return this.projects.get(id)
  }

  async deleteProject(id: string) {
    return this.projects.delete(id)
  }
}

export const db = new ShaderDatabase() 