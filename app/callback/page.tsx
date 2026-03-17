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
      const serverProjects = await CloudSync.fetchServerProjects()
      const localProjects = ProjectManager.getAllProjects()

      const newServer = serverProjects.find((sp) => !localProjects.some((lp) => lp.id === sp.id))
      const newLocal = localProjects.find((lp) => !serverProjects.some((sp) => sp.id === lp.id))
      const outdatedLocalFromServer = serverProjects.find((sp) => {
        const lp = localProjects.find((l) => l.id === sp.id)
        if (!lp) return false
        return Number(sp.last_edited_ts) > new Date(lp.updatedAt).getTime()
      })
      const outdatedServerFromLocal = localProjects.find((lp) => {
        const sp = serverProjects.find((s) => s.id === lp.id)
        if (!sp) return false
        return new Date(lp.updatedAt).getTime() > Number(sp.last_edited_ts)
      })

      if (newServer || newLocal || outdatedLocalFromServer || outdatedServerFromLocal) {
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
      const serverProjects = await CloudSync.fetchServerProjects()
      const localProjects = ProjectManager.getAllProjects()
      const total = serverProjects.length + localProjects.length
      let done = 0

      // --- Pull: server → local ---
      for (const sp of serverProjects) {
        const lp = localProjects.find((l) => l.id === sp.id)
        const serverTs = Number(sp.last_edited_ts)
        const localTs = lp ? new Date(lp.updatedAt).getTime() : 0

        if (!lp || serverTs > localTs) {
          const fullData = await CloudSync.fetchFullProject(sp.id)
          if (fullData) {
            const serverIso = new Date(serverTs).toISOString()
            const projectToSave: Project = {
              id: fullData.id,
              shortId: fullData.slug,   // server uses slug as shortId
              name: fullData.title,     // server uses title as name
              description: lp?.description || "",
              createdAt: lp?.createdAt || serverIso,
              updatedAt: serverIso,
              lastSyncedAt: new Date().toISOString(),
              isOfflineOnly: false,
              data: lp ? {
                elements: CloudSync.mergeElements(lp.data?.elements || [], fullData.data?.elements || []),
                appState: { ...(lp.data?.appState || {}), ...(fullData.data?.appState || {}) },
                files: CloudSync.mergeFiles(lp.data?.files || {}, fullData.data?.files || {}),
                libraryItems: [
                  ...(lp.data?.libraryItems || []),
                  ...(fullData.data?.libraryItems || []),
                ].filter((v, i, a) => a.findIndex((v2: any) => v2.id === v.id) === i),
              } : {
                elements: fullData.data?.elements || [],
                appState: fullData.data?.appState || {},
                files: fullData.data?.files || {},
                libraryItems: fullData.data?.libraryItems || [],
              },
            }
            const allLocals = ProjectManager.getAllProjects()
            const idx = allLocals.findIndex((l) => l.id === projectToSave.id)
            if (idx !== -1) {
              allLocals[idx] = projectToSave
            } else {
              allLocals.push(projectToSave)
            }
            localStorage.setItem("excalidraw-projects", JSON.stringify(allLocals))
          }
        }
        done++
        setProgress(Math.floor((done / total) * 100))
      }

      // --- Push: local → server ---
      const refreshedLocals = ProjectManager.getAllProjects()
      for (const lp of refreshedLocals) {
        const sp = serverProjects.find((s) => s.id === lp.id)
        const serverTs = sp ? Number(sp.last_edited_ts) : 0
        if (!sp || new Date(lp.updatedAt).getTime() > serverTs) {
          await CloudSync.uploadProject(lp)
          lp.lastSyncedAt = new Date().toISOString()
        }
        done++
        setProgress(Math.floor((done / total) * 100))
      }

      localStorage.setItem("excalidraw-projects", JSON.stringify(refreshedLocals))
      router.push("/")
    } catch (e) {
      console.error(e)
      setSyncing(false)
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
