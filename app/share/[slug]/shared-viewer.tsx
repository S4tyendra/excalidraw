
import { useEffect, useState, useMemo } from "react"
import { Excalidraw, THEME } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { Button } from "@/components/ui/button"
import { CloudSync } from "@/lib/cloud-sync"
import { ProjectManager } from "@/lib/project-manager"
import { ArrowLeft, Loader2, GitFork, Sun, Moon, Link2 } from "lucide-react"
import { useTheme } from "next-themes"
import {  useNavigate  } from 'react-router-dom'
import {  Link  } from 'react-router-dom'

export default function SharedViewer({ slug }: { slug: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [isForking, setIsForking] = useState(false)

  useEffect(() => {
    CloudSync.fetchSharedProject(slug)
      .then((res) => {
        if (res && res.elements) {
          setData(res)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleFork = async () => {
    if (!data || isForking) return
    setIsForking(true)
    try {
      const project = ProjectManager.createProject(`Fork of ${slug}`, "Forked from shared link")
      ProjectManager.updateProjectData(project.id, {
        elements: data.elements || [],
        appState: data.appState || {},
        files: data.files || {},
        libraryItems: data.libraryItems || []
      })
      navigate(`/${project.shortId}`)
    } catch (err) {
      console.error("Fork failed:", err)
      setIsForking(false)
    }
  }

  const excalidrawTheme = theme === "dark" ? THEME.DARK : THEME.LIGHT

  const ExcalidrawMemo = useMemo(() => {
    if (!data) return null;
    return (
      <Excalidraw
        theme={excalidrawTheme}
        initialData={data}
        viewModeEnabled={true}
        UIOptions={{ canvasActions: { toggleTheme: false } }}
      />
    )
  }, [data, excalidrawTheme])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading shared project...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
       <div className="h-screen flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-muted-foreground">The shared link is invalid or has expired.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shadow-sm z-50">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
          <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm border-l pl-3 ml-1">
            <Link2 className="w-4 h-4" />
            <span>Shared Link: <b>{slug}</b></span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="default" size="sm" onClick={handleFork} disabled={isForking}>
            {isForking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GitFork className="w-4 h-4 mr-2" />
            )}
            {isForking ? "Forking..." : "Fork & Edit"}
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        {ExcalidrawMemo}
      </div>
    </div>
  )
}
