"use client"

import { useState, useEffect, useCallback } from "react"
import { Excalidraw, THEME } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon, Share2 } from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useDebounce } from "@/hooks/use-debounce"
import { ProjectSidebar } from "./project-sidebar"
import { tr } from "date-fns/locale"

interface ExcalidrawEditorProps {
  project: Project
  onProjectChange: (project: Project) => void
  onNewProject: () => void
}

export default function ExcalidrawEditor({ project, onProjectChange, onNewProject }: ExcalidrawEditorProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [currentElements, setCurrentElements] = useState<any[]>([])
  const [currentAppState, setCurrentAppState] = useState<any>({})
  const [currentFiles, setCurrentFiles] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  // Debounce the save data to avoid too frequent saves
  const debouncedElements = useDebounce(currentElements, 200)
  const debouncedAppState = useDebounce(currentAppState, 200)
  const debouncedFiles = useDebounce(currentFiles, 200)

  // Handle Excalidraw changes
  const handleChange = useCallback((elements: any[], appState: any, files: any) => {
    setCurrentElements(elements)
    setCurrentAppState(appState)
    setCurrentFiles(files)
  }, [])

  useEffect(() => {
    setIsLoading(false)
  }, [])

  // Auto-save when debounced data changes
  useEffect(() => {
    if (
      debouncedElements.length === 0 &&
      Object.keys(debouncedAppState).length === 0 &&
      Object.keys(debouncedFiles).length === 0
    )
      return

    try {
      ProjectManager.updateProjectData(project.id, {
        elements: debouncedElements,
        appState: {
          viewBackgroundColor: debouncedAppState.viewBackgroundColor,
          currentItemStrokeColor: debouncedAppState.currentItemStrokeColor,
          currentItemBackgroundColor: debouncedAppState.currentItemBackgroundColor,
          currentItemFillStyle: debouncedAppState.currentItemFillStyle,
          currentItemStrokeWidth: debouncedAppState.currentItemStrokeWidth,
          currentItemStrokeStyle: debouncedAppState.currentItemStrokeStyle,
          currentItemRoughness: debouncedAppState.currentItemRoughness,
          currentItemOpacity: debouncedAppState.currentItemOpacity,
          currentItemFontFamily: debouncedAppState.currentItemFontFamily,
          currentItemFontSize: debouncedAppState.currentItemFontSize,
          currentItemTextAlign: debouncedAppState.currentItemTextAlign,
          currentItemStartArrowhead: debouncedAppState.currentItemStartArrowhead,
          currentItemEndArrowhead: debouncedAppState.currentItemEndArrowhead,
          scrollX: debouncedAppState.scrollX,
          scrollY: debouncedAppState.scrollY,
          zoom: debouncedAppState.zoom,
          gridSize: debouncedAppState.gridSize,
          colorPalette: debouncedAppState.colorPalette,
        },
        files: debouncedFiles,
      })
    } catch (error) {
      console.error("Error auto-saving project:", error)
    }
  }, [debouncedElements, debouncedAppState, debouncedFiles, project.id])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleProjectSelect = (selectedProject: Project) => {
    window.location.hash = selectedProject.shortId
    onProjectChange(selectedProject)
  }

  const excalidrawTheme = theme === "dark" ? THEME.DARK : THEME.LIGHT

  return (
    <>
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                {project.shortId}
              </span>
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" disabled title="Share functionality coming soon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1">
          {!isLoading && (
            <Excalidraw
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={{
                elements: project.data?.elements || [],
                appState: project.data?.appState || {viewBackgroundColor: "#a5d8ff"},
                files: project.data?.files || {},
              }}
              onChange={handleChange}
              theme={excalidrawTheme}
              name={project.name}
              UIOptions={{
                tools: {
                  image: true,
                },
              }}
              renderTopRightUI={() => (
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">Auto save!</div>
                </div>
              )}
              handleKeyboardGlobally={true}

            />
          )}
        </div>
      </div>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentProject={project}
        onProjectSelect={handleProjectSelect}
        onNewProject={onNewProject}
      />
    </>
  )
}
