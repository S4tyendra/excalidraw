export interface Project {
  id: string
  shortId: string // This will serve as both shortId and slug
  name: string
  description: string
  createdAt: string
  updatedAt: string
  data?: {
    elements: any[]
    appState: any
    files?: any
    libraryItems?: any[]
  }
}

export class ProjectManager {
  private static readonly STORAGE_KEY = "excalidraw-projects"

  private static generateShortId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static async fetchLibraryFromURL(url: string): Promise<any[]> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch library: ${response.statusText}`)
      }
      const libraryData = await response.json()
      
      // Transform library data to Excalidraw format
      if (libraryData.library && Array.isArray(libraryData.library)) {
        return libraryData.library.map((item: any, index: number) => ({
          id: item.id || crypto.randomUUID(),
          status: "published",
          created: Date.now() + index,
          elements: item.elements || item,
        }))
      }
      
      return []
    } catch (error) {
      console.error("Error fetching library:", error)
      throw error
    }
  }

  static getAllProjects(): Project[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const projects = stored ? JSON.parse(stored) : []
      
      // Migration: ensure shortId exists for legacy projects
      let needsSave = false
      const migratedProjects = projects.map((project: any) => {
        if (!project.shortId) {
          project.shortId = this.generateShortId()
          needsSave = true
        }
        return project
      })
      
      if (needsSave) {
        this.saveProjects(migratedProjects)
      }
      
      return migratedProjects
    } catch (error) {
      console.error("Error loading projects:", error)
      return []
    }
  }

  static getProject(id: string): Project | null {
    const projects = this.getAllProjects()
    return projects.find((p) => p.id === id) || null
  }

  static getProjectByShortId(shortId: string): Project | null {
    const projects = this.getAllProjects()
    return projects.find((p) => p.shortId === shortId) || null
  }

  static createProject(name: string, description = ""): Project {
    const project: Project = {
      id: crypto.randomUUID(),
      shortId: this.generateShortId(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        elements: [],
        appState: {},
        libraryItems: [],
      },
    }

    const projects = this.getAllProjects()
    projects.push(project)
    this.saveProjects(projects)

    return project
  }

  static updateProject(id: string, updates: Partial<Pick<Project, "name" | "description">>): void {
    const projects = this.getAllProjects()
    const index = projects.findIndex((p) => p.id === id)

    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      this.saveProjects(projects)
    }
  }

  static updateProjectData(id: string, data: { elements: any[]; appState: any; files?: any; libraryItems?: any[] }): void {
    const projects = this.getAllProjects()
    const index = projects.findIndex((p) => p.id === id)

    if (index !== -1) {
      projects[index] = {
        ...projects[index],
        data,
        updatedAt: new Date().toISOString(),
      }
      this.saveProjects(projects)
    }
  }

  static deleteProject(id: string): void {
    const projects = this.getAllProjects()
    const filtered = projects.filter((p) => p.id !== id)
    this.saveProjects(filtered)
  }

  private static saveProjects(projects: Project[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
    } catch (error) {
      console.error("Error saving projects:", error)
    }
  }

  static exportProject(id: string): string | null {
    const project = this.getProject(id)
    return project ? JSON.stringify(project, null, 2) : null
  }

  static importProject(projectData: string): Project | null {
    try {
      const project = JSON.parse(projectData) as Project

      // Generate new ID to avoid conflicts
      project.id = crypto.randomUUID()
      project.shortId = this.generateShortId()
      project.updatedAt = new Date().toISOString()

      const projects = this.getAllProjects()
      projects.push(project)
      this.saveProjects(projects)

      return project
    } catch (error) {
      console.error("Error importing project:", error)
      return null
    }
  }
}
