export const API_BASE = "https://draw-api.devh.in";

// Shape of a server project list item
export interface ServerProjectMeta {
  id: string;
  slug: string;
  title: string;
  last_edited_ts: string; // numeric ms timestamp as string e.g. "1715678901235"
}

// Shape of a full server project response
export interface ServerProjectFull {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  last_edited_ts: string; // numeric ms timestamp as string
  data: string; // JSON-stringified { elements, appState, files }
}

export class CloudSync {
  static getSession(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("session_id");
  }

  private static authHeaders(): Record<string, string> {
    const session = this.getSession();
    if (!session) return {};
    return { Authorization: `Bearer ${session}` };
  }

  /** Convert server's numeric-string timestamp to JS Date. Uses Number() to avoid Invalid Date. */
  static tsToDate(ts: string | number): Date {
    return new Date(Number(ts));
  }

  /** Fetch metadata list of all projects from server. */
  static async fetchServerProjects(): Promise<ServerProjectMeta[]> {
    if (!this.getSession()) return [];
    try {
      const res = await fetch(`${API_BASE}/read/projects`, {
        headers: this.authHeaders(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Fetch a full project from the server.
   * Returns the parsed data object (elements/appState/files), plus metadata.
   * Note: server returns `data` as a JSON *string* — we parse it here.
   */
  static async fetchFullProject(
    id: string
  ): Promise<{ id: string; slug: string; title: string; last_edited_ts: string; data: any } | null> {
    if (!this.getSession()) return null;
    try {
      const res = await fetch(`${API_BASE}/read/project/${id}`, {
        headers: this.authHeaders(),
      });
      if (!res.ok) return null;
      const raw: ServerProjectFull = await res.json();
      let parsedData: any = {};
      try {
        parsedData = typeof raw.data === "string" ? JSON.parse(raw.data) : raw.data;
      } catch {
        parsedData = {};
      }
      return {
        id: raw.id,
        slug: raw.slug,
        title: raw.title,
        last_edited_ts: raw.last_edited_ts,
        data: parsedData,
      };
    } catch {
      return null;
    }
  }

  /**
   * Upload (upsert) a project to server.
   * Payload must include: slug, title, last_edited_ts (number), data (object).
   */
  static async uploadProject(project: {
    id: string;
    shortId: string;
    name: string;
    description?: string;
    updatedAt: string;
    data?: any;
  }, signal?: AbortSignal): Promise<boolean> {
    if (!this.getSession()) return false;
    try {
      const payload = {
        slug: project.shortId,
        title: project.name,
        last_edited_ts: new Date(project.updatedAt).getTime(),
        data: project.data ?? { elements: [], appState: {}, files: {} },
      };
      const res = await fetch(`${API_BASE}/write/project/${project.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.authHeaders(),
        },
        body: JSON.stringify(payload),
        signal,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Delete a project from server. */
  static async deleteServerProject(id: string): Promise<boolean> {
    if (!this.getSession()) return false;
    try {
      const res = await fetch(`${API_BASE}/write/delete/${id}`, {
        method: "DELETE",
        headers: this.authHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Create a public share link for a project.
   * Requires auth. Returns { shareUrl, slug } or null on failure.
   * Snapshot is frozen — future edits won't update the share link.
   */
  static async shareProject(id: string): Promise<{ shareUrl: string; slug: string } | null> {
    if (!this.getSession()) return null;
    try {
      const res = await fetch(`${API_BASE}/share/${id}`, {
        method: "POST",
        headers: this.authHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /** Fetch shared project data — no auth required. Returns raw Excalidraw JSON or null. */
  static async fetchSharedProject(slug: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/share/f/${slug}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Merge two element arrays by ID.
   * Wins: higher version, then higher `updated` timestamp.
   * Preserves z-order from whichever side won.
   */
  static mergeElements(local: any[] = [], server: any[] = []): any[] {
    const map = new Map<string, any>();

    // Seed with server elements
    for (const el of server) {
      map.set(el.id, el);
    }

    // Overlay with local, winning if locally newer
    for (const el of local) {
      const existing = map.get(el.id);
      if (!existing) {
        map.set(el.id, el);
      } else {
        const localVer = el.version ?? 0;
        const serverVer = existing.version ?? 0;
        const localTs = el.updated ?? 0;
        const serverTs = existing.updated ?? 0;
        if (localVer > serverVer || (localVer === serverVer && localTs > serverTs)) {
          map.set(el.id, el);
        }
      }
    }

    return Array.from(map.values());
  }

  /**
   * Merge file maps.
   * Critically: if local has base64 and server has an http URL for the same file,
   * keep the local base64 so the app stays 100% offline-capable.
   */
  static mergeFiles(
    local: Record<string, any> = {},
    server: Record<string, any> = {}
  ): Record<string, any> {
    const merged: Record<string, any> = { ...server };

    for (const fileId of Object.keys(local)) {
      const lf = local[fileId];
      const sf = merged[fileId];

      if (!sf) {
        merged[fileId] = lf;
      } else {
        const localIsBase64 = typeof lf.dataURL === "string" && lf.dataURL.startsWith("data:");
        const serverIsHttp = typeof sf.dataURL === "string" && sf.dataURL.startsWith("http");
        if (localIsBase64 && serverIsHttp) {
          // Always preserve base64 over HTTP link for offline capability
          merged[fileId] = { ...sf, dataURL: lf.dataURL };
        } else {
          // Prefer whichever was created more recently
          if ((lf.created ?? 0) > (sf.created ?? 0)) {
            merged[fileId] = lf;
          }
        }
      }
    }

    return merged;
  }
}
