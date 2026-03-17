export const API_BASE = "https://drawdevhinapi.2k24.workers.dev";

export class CloudSync {
  static getSession(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("session_id");
  }

  static async fetchServerProjects(): Promise<any[]> {
    const session = this.getSession();
    if (!session) return [];
    
    try {
      const res = await fetch(`${API_BASE}/read/projects`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static async fetchFullProject(id: string): Promise<any> {
    const session = this.getSession();
    if (!session) return null;
    
    try {
      const res = await fetch(`${API_BASE}/read/project/${id}`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  static async uploadProject(project: any): Promise<boolean> {
    const session = this.getSession();
    if (!session) return false;
    
    // Validate if data is less than 500KB or images < 1MB on client if possible, 
    // but right now just attempt the upload.
    try {
      const payload = {
        data: project.data, // Contains elements, appState, files, etc.
        last_edited_ts: new Date(project.updatedAt).getTime()
      };

      const res = await fetch(`${API_BASE}/write/project/${project.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session}`,
        },
        body: JSON.stringify(payload)
      });
      
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  static async deleteServerProject(id: string): Promise<boolean> {
    const session = this.getSession();
    if (!session) return false;
    
    try {
      const res = await fetch(`${API_BASE}/write/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session}` },
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  static mergeElements(localElements: any[] = [], serverElements: any[] = []) {
    const elementMap = new Map();
    
    // Add all server elements
    for (const el of serverElements) {
      elementMap.set(el.id, el);
    }

    // Overlay local elements, prioritizing the higher version or updated timestamp
    for (const el of localElements) {
      const existing = elementMap.get(el.id);
      if (!existing) {
        elementMap.set(el.id, el);
      } else {
        const localVersion = el.version || 0;
        const serverVersion = existing.version || 0;
        const localUpdated = el.updated || 0;
        const serverUpdated = existing.updated || 0;
        
        if (localVersion > serverVersion || (localVersion === serverVersion && localUpdated > serverUpdated)) {
          elementMap.set(el.id, el);
        }
      }
    }

    // Convert map back to array and return sorted (Excalidraw elements usually need z-index order based on index)
    // Though map iteration order preserves insertion order, which is fine, we might just rely on Excalidraw's handling.
    return Array.from(elementMap.values());
  }

  static mergeFiles(localFiles: Record<string, any> = {}, serverFiles: Record<string, any> = {}) {
    const files = { ...serverFiles };
    
    // Loop through local files.
    for (const fileId in localFiles) {
      const localFile = localFiles[fileId];
      const serverFile = files[fileId];
      
      if (!serverFile) {
        files[fileId] = localFile;
      } else {
        // If server has http link and local has base64, KEEP local base64 to ensure 100% offline!
        if (localFile.dataURL && localFile.dataURL.startsWith("data:") && 
            serverFile.dataURL && serverFile.dataURL.startsWith("http")) {
          files[fileId] = { ...serverFile, dataURL: localFile.dataURL };
        } else {
          // In other cases, use server or higher lastRetrieved
          const localTime = localFile.created || 0;
          const serverTime = serverFile.created || 0;
          if (localTime > serverTime) {
            files[fileId] = localFile;
          }
        }
      }
    }
    return files;
  }
}
