"use client";
export interface Project {
  id: string
  shortId: string // This will serve as both shortId and slug
  name: string
  description: string
  createdAt: string
  updatedAt: string
  lastSyncedAt?: string // Track last successful sync for offline/online sync
  isOfflineOnly?: boolean // Flag for projects created while offline
  data?: {
    elements: any[]
    appState: any
    files?: any
    libraryItems?: any[]
  }
}

interface ProjectExportData {
  version: string
  exportDate: string
  projects: Project[]
}

export class ProjectManager {
  private static readonly STORAGE_KEY = "excalidraw-projects"
  private static readonly BACKUP_KEY = "excalidraw-projects-backup"
  private static readonly OFFLINE_QUEUE_KEY = "excalidraw-offline-queue"

  private static generateShortId(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Enhanced save with automatic backup
  private static saveProjects(projects: Project[]): void {
    if (typeof window === "undefined") return

    try {
      const currentData = localStorage.getItem(this.STORAGE_KEY)
      
      // Create backup of current data before saving new data
      if (currentData) {
        localStorage.setItem(this.BACKUP_KEY, currentData)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
      
      // Mark successful save
      localStorage.setItem(`${this.STORAGE_KEY}-last-save`, Date.now().toString())
    } catch (error) {
      console.error("Error saving projects:", error)
      
      // Try to recover from backup if main save fails
      this.recoverFromBackup()
      throw error
    }
  }

  // Backup recovery mechanism
  private static recoverFromBackup(): boolean {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY)
      if (backup) {
        localStorage.setItem(this.STORAGE_KEY, backup)
        console.log("Projects recovered from backup")
        return true
      }
    } catch (error) {
      console.error("Backup recovery failed:", error)
    }
    return false
  }

  // Enhanced loading with backup fallback
  static getAllProjects(): Project[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      let projects: Project[] = []
      
      if (stored) {
        projects = JSON.parse(stored)
      } else {
        // Try to recover from backup
        const backup = localStorage.getItem(this.BACKUP_KEY)
        if (backup) {
          projects = JSON.parse(backup)
          console.log("Loaded projects from backup")
        }
      }
      
      // Migration: ensure shortId exists for legacy projects
      let needsSave = false
      const migratedProjects = projects.map((project: any) => {
        if (!project.shortId) {
          project.shortId = this.generateShortId()
          needsSave = true
        }
        // Add offline/sync tracking for existing projects
        if (project.lastSyncedAt === undefined) {
          project.lastSyncedAt = project.updatedAt
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
      
      // Try backup recovery
      if (this.recoverFromBackup()) {
        return this.getAllProjects() // Retry after recovery
      }
      
      return []
    }
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

  static getProject(id: string): Project | null {
    const projects = this.getAllProjects()
    return projects.find((p) => p.id === id) || null
  }

  static getProjectByShortId(shortId: string): Project | null {
    const projects = this.getAllProjects()
    return projects.find((p) => p.shortId === shortId) || null
  }

  static createProject(name: string, description = ""): Project {
    const now = new Date().toISOString()
    const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false
    
    const project: Project = {
      id: crypto.randomUUID(),
      shortId: this.generateShortId(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: isOffline ? undefined : now,
      isOfflineOnly: isOffline,
      data: {
        elements: [],
        appState: {},
        libraryItems: [],
      },
    }

    const projects = this.getAllProjects()
    projects.push(project)
    this.saveProjects(projects)

    // Queue for sync if offline
    if (isOffline) {
      this.queueOfflineAction('create', project.id, project)
    }

    return project
  }

  static updateProject(id: string, updates: Partial<Pick<Project, "name" | "description">>): void {
    const projects = this.getAllProjects()
    const index = projects.findIndex((p) => p.id === id)

    if (index !== -1) {
      const now = new Date().toISOString()
      const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false
      
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: now,
        lastSyncedAt: isOffline ? projects[index].lastSyncedAt : now,
      }
      this.saveProjects(projects)
      
      // Queue for sync if offline
      if (isOffline) {
        this.queueOfflineAction('update', id, { ...updates, updatedAt: now })
      }
    }
  }

  static updateProjectData(id: string, data: { elements: any[]; appState: any; files?: any; libraryItems?: any[] }): void {
    const projects = this.getAllProjects()
    const index = projects.findIndex((p) => p.id === id)

    if (index !== -1) {
      const now = new Date().toISOString()
      const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false
      
      projects[index] = {
        ...projects[index],
        data,
        updatedAt: now,
        lastSyncedAt: isOffline ? projects[index].lastSyncedAt : now,
      }
      this.saveProjects(projects)
      
      // Queue for sync if offline (but throttle data updates)
      if (isOffline) {
        this.throttledQueueDataUpdate(id, data)
      }
    }
  }

  // Throttled offline queue for data updates to prevent excessive queuing
  private static dataUpdateTimeouts = new Map<string, NodeJS.Timeout>()
  
  private static throttledQueueDataUpdate(id: string, data: any): void {
    // Clear existing timeout
    const existingTimeout = this.dataUpdateTimeouts.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      this.queueOfflineAction('updateData', id, data)
      this.dataUpdateTimeouts.delete(id)
    }, 5000) // Wait 5 seconds before queuing
    
    this.dataUpdateTimeouts.set(id, timeout)
  }

  static deleteProject(id: string): void {
    const projects = this.getAllProjects()
    const filtered = projects.filter((p) => p.id !== id)
    this.saveProjects(filtered)
    
    // Queue for sync if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.queueOfflineAction('delete', id, null)
    }
  }

  // Offline action queue management
  private static queueOfflineAction(action: string, id: string, data: any): void {
    try {
      const queue = this.getOfflineQueue()
      queue.push({
        action,
        id,
        data,
        timestamp: Date.now()
      })
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error("Error queuing offline action:", error)
    }
  }

  private static getOfflineQueue(): any[] {
    try {
      const stored = localStorage.getItem(this.OFFLINE_QUEUE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error reading offline queue:", error)
      return []
    }
  }

  // Process offline queue when back online
  static async processOfflineQueue(): Promise<void> {
    const queue = this.getOfflineQueue()
    
    if (queue.length === 0) return
    
    console.log(`Processing ${queue.length} offline actions...`)
    
    for (const item of queue) {
      try {
        // Process each queued action
        // In a real implementation, you would sync with a server here
        console.log(`Processing offline action: ${item.action} for ${item.id}`)
        
        // Mark items as synced
        if (item.action !== 'delete') {
          const project = this.getProject(item.id)
          if (project) {
            project.lastSyncedAt = new Date().toISOString()
            project.isOfflineOnly = false
          }
        }
      } catch (error) {
        console.error(`Error processing offline action for ${item.id}:`, error)
      }
    }
    
    // Clear the queue
    localStorage.removeItem(this.OFFLINE_QUEUE_KEY)
    
    // Save updated projects
    const projects = this.getAllProjects()
    this.saveProjects(projects)
    
    console.log("Offline queue processed successfully")
  }

  // Export functionality with enhanced metadata
  static exportProject(id: string): string | null {
    const project = this.getProject(id)
    if (!project) return null
    
    const exportData: ProjectExportData = {
      version: "1.1", // Updated version for offline support
      exportDate: new Date().toISOString(),
      projects: [project]
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  static exportProjects(ids: string[]): string | null {
    const projects = this.getAllProjects().filter(p => ids.includes(p.id))
    if (projects.length === 0) return null
    
    const exportData: ProjectExportData = {
      version: "1.1",
      exportDate: new Date().toISOString(),
      projects
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  static exportAllProjects(): string {
    const projects = this.getAllProjects()
    
    const exportData: ProjectExportData = {
      version: "1.1",
      exportDate: new Date().toISOString(),
      projects
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  // Enhanced import with version handling
  static importProject(projectData: string): Project | null {
    try {
      const data = JSON.parse(projectData)
      
      // Handle both single project and multi-project exports
      let projectsToImport: Project[] = []
      
      if (data.projects && Array.isArray(data.projects)) {
        // New format with version info
        projectsToImport = data.projects
      } else if (data.id && data.name) {
        // Legacy single project format
        projectsToImport = [data as Project]
      } else {
        throw new Error("Invalid project data format")
      }
      
      const importedProjects: Project[] = []
      const existingProjects = this.getAllProjects()
      
      for (const project of projectsToImport) {
        // Generate new ID to avoid conflicts
        const importedProject: Project = {
          ...project,
          id: crypto.randomUUID(),
          shortId: this.generateShortId(),
          updatedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          isOfflineOnly: false
        }
        
        existingProjects.push(importedProject)
        importedProjects.push(importedProject)
      }
      
      this.saveProjects(existingProjects)
      
      return importedProjects[0] || null // Return first imported project
    } catch (error) {
      console.error("Error importing project:", error)
      return null
    }
  }

  // Storage health check
  static checkStorageHealth(): { 
    isHealthy: boolean; 
    hasBackup: boolean; 
    lastSave?: number; 
    storageUsed: number 
  } {
    try {
      const hasMain = !!localStorage.getItem(this.STORAGE_KEY)
      const hasBackup = !!localStorage.getItem(this.BACKUP_KEY)
      const lastSaveStr = localStorage.getItem(`${this.STORAGE_KEY}-last-save`)
      const lastSave = lastSaveStr ? parseInt(lastSaveStr) : undefined
      
      // Calculate storage usage
      let storageUsed = 0
      for (let key in localStorage) {
        if (key.startsWith('excalidraw-')) {
          storageUsed += localStorage.getItem(key)?.length || 0
        }
      }
      
      return {
        isHealthy: hasMain || hasBackup,
        hasBackup,
        lastSave,
        storageUsed
      }
    } catch (error) {
      return {
        isHealthy: false,
        hasBackup: false,
        storageUsed: 0
      }
    }
  }
}
