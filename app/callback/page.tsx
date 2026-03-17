"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ProjectManager, Project } from "@/lib/project-manager"
import { CloudSync } from "@/lib/cloud-sync"
import { ArrowRightLeft, Loader2, Database, UploadCloud } from "lucide-react"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [needsSync, setNeedsSync] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (token) {
      localStorage.setItem("session_id", token)
      checkSyncStatus()
    } else {
      router.push("/")
    }
  }, [token])

  const checkSyncStatus = async () => {
    try {
      const serverProjects = await CloudSync.fetchServerProjects() || []
      const localProjects = ProjectManager.getAllProjects()

      // Compare if we need to sync
      let newServer = serverProjects.find((sp: any) => !localProjects.some((lp: any) => lp.id === sp.id))
      let newLocal = localProjects.find((lp: any) => !serverProjects.some((sp: any) => sp.id === lp.id))
      let outdatedServer = localProjects.find((lp: any) => {
        let sp = serverProjects.find((sp: any) => sp.id === lp.id);
        if (!sp) return false;
        return new Date(lp.updatedAt).getTime() > new Date(sp.updatedAt || sp.last_edited_ts || 0).getTime()
      })
      let outdatedLocal = serverProjects.find((sp: any) => {
        let lp = localProjects.find((lp: any) => lp.id === sp.id);
        if (!lp) return false;
        return new Date(sp.updatedAt || sp.last_edited_ts || 0).getTime() > new Date(lp.updatedAt).getTime()
      })

      if (newServer || newLocal || outdatedServer || outdatedLocal) {
        setNeedsSync(true)
      } else {
        router.push("/")
      }
    } catch (e) {
      console.error(e)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)

    try {
      const serverProjects = await CloudSync.fetchServerProjects() || []
      const localProjects = ProjectManager.getAllProjects()

      const totalOperations = serverProjects.length + localProjects.length
      let completedOps = 0;

      // Ensure server projects are copied to local if new or newer
      for (const sp of serverProjects) {
        let lp = localProjects.find(l => l.id === sp.id)
        const serverDate = new Date(sp.updatedAt || sp.last_edited_ts || 0).getTime()
        const localDate = lp ? new Date(lp.updatedAt).getTime() : 0

        if (!lp || serverDate > localDate) {
          // Fetch full data from server & save locally
          const fullData = await CloudSync.fetchFullProject(sp.id)
          if (fullData) {
            let projectToSave: Project = {
              id: fullData.id || sp.id,
              shortId: fullData.shortId || sp.shortId || Math.random().toString(36).substring(2, 8),
              name: fullData.name || sp.name || "Untitled",
              description: fullData.description || sp.description || "",
              createdAt: fullData.createdAt || sp.createdAt || new Date().toISOString(),
              updatedAt: fullData.updatedAt || new Date(sp.last_edited_ts).toISOString() || new Date().toISOString(),
              lastSyncedAt: new Date().toISOString(),
              isOfflineOnly: false,
              data: {
                elements: fullData.data?.elements || [],
                appState: fullData.data?.appState || {},
                files: fullData.data?.files || {},
                libraryItems: fullData.data?.libraryItems || []
              }
            }

            // If locally present but outdated, we should merge the data intelligently
            if (lp) { 
               projectToSave.data = {
                  elements: CloudSync.mergeElements(lp.data?.elements || [], fullData.data?.elements || []),
                  appState: { ...lp.data?.appState, ...fullData.data?.appState },
                  files: CloudSync.mergeFiles(lp.data?.files || {}, fullData.data?.files || {}),
                  libraryItems: [  ...(lp.data?.libraryItems || []), ...(fullData.data?.libraryItems || []) ].filter((v,i,a)=>a.findIndex(v2=>v2.id===v.id)===i) // simplistic library item merge
               }
            }

            let allLocals = ProjectManager.getAllProjects()
            let existingIdx = allLocals.findIndex(l => l.id === projectToSave.id)
            if (existingIdx !== -1) {
              // Hacky way but ProjectManager uses localStorage
              allLocals[existingIdx] = projectToSave
              localStorage.setItem("excalidraw-projects", JSON.stringify(allLocals))
            } else {
              allLocals.push(projectToSave)
              localStorage.setItem("excalidraw-projects", JSON.stringify(allLocals))
            }
          }
        }
        completedOps++;
        setProgress(Math.floor((completedOps / totalOperations) * 100))
      }

      // Refresh local projects list before upload pass to get any merged content synced if needed (if server was older and local merged)
      const refreshedLocals = ProjectManager.getAllProjects()

      // Upload local projects that are new or newer to the server
      for (const lp of refreshedLocals) {
        let sp = serverProjects.find((s: any) => s.id === lp.id)
        const serverDate = sp ? new Date(sp.updatedAt || sp.last_edited_ts || 0).getTime() : 0
         
        if (!sp || new Date(lp.updatedAt).getTime() > serverDate) {
          // Upload this local project
          await CloudSync.uploadProject(lp)
          // mark as synced locally
          lp.lastSyncedAt = new Date().toISOString()
        }
        completedOps++;
        setProgress(Math.floor((completedOps / totalOperations) * 100))
      }

      // Save the lastSyncedAt tags back to local storage
      localStorage.setItem("excalidraw-projects", JSON.stringify(refreshedLocals))

      router.push("/")
    } catch (e) {
      console.error(e)
      setSyncing(false)
      // Allow user to skip
    }
  }

  const handleSkip = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold">Authenticating...</h2>
        <p className="text-muted-foreground mt-2">Checking your drawing projects list...</p>
      </div>
    )
  }

  if (!needsSync) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-semibold">Redirecting...</h2>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-lg border">
        <div className="flex justify-center mb-6">
          <div className="relative flex items-center justify-center">
            <Database className="w-10 h-10 text-muted-foreground absolute -left-8" />
            <ArrowRightLeft className="w-8 h-8 text-primary mx-8" />
            <UploadCloud className="w-10 h-10 text-muted-foreground absolute -right-8" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2">Sync Your Projects</h1>
        <p className="text-muted-foreground text-center mb-8">
          We found differences between your local projects and server records. Would you like to merge and upload now?
        </p>

        {syncing ? (
          <div className="space-y-4">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-center font-medium">Syncing... {progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            <Button size="lg" onClick={handleSync} className="w-full">
              Sync Projects Now
            </Button>
            <Button size="lg" variant="outline" onClick={handleSkip} className="w-full">
              Skip for Now
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
