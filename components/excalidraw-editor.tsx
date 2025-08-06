"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Excalidraw, THEME } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon, Share2 } from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { ProjectSidebar } from "./project-sidebar"
import { OfflineIndicator } from "./offline-indicator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { tr } from "date-fns/locale"
import Link from "next/link"

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
  const [currentLibraryItems, setCurrentLibraryItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const hasInitialized = useRef(false)
  const { toast } = useToast()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // Memoize initial data to prevent unnecessary re-renders
  const initialData = useMemo(() => ({
    elements: project.data?.elements || [],
    appState: {
      viewBackgroundColor: "#fdf8f6",
      ...project.data?.appState,
    },
    files: project.data?.files || {},
    libraryItems: project.data?.libraryItems || [],
  }), [project.id]) // Only re-create when project.id changes

  // Debounce the save data to avoid too frequent saves
  const debouncedElements = useDebounce(currentElements, 500)
  const debouncedAppState = useDebounce(currentAppState, 500)
  const debouncedFiles = useDebounce(currentFiles, 500)
  const debouncedLibraryItems = useDebounce(currentLibraryItems, 500)

  // Handle Excalidraw changes - use proper event handlers instead of polling
  const handleElementsChange = useCallback((elements: readonly any[]) => {
    if (!hasInitialized.current) return
    setCurrentElements([...elements])
  }, [])

  const handleAppStateChange = useCallback((appState: any) => {
    if (!hasInitialized.current) return
    setCurrentAppState(appState)
  }, [])

  const handleFilesChange = useCallback((files: any) => {
    if (!hasInitialized.current) return
    setCurrentFiles(files)
  }, [])

  const handleLibraryChange = useCallback((libraryItems: readonly any[]) => {
    if (!hasInitialized.current) return
    setCurrentLibraryItems([...libraryItems])
  }, [])

  useEffect(() => {
    setIsLoading(false)
    hasInitialized.current = false // Reset for new project
    
    // Reset state when project changes
    setCurrentElements(project.data?.elements || [])
    setCurrentAppState(project.data?.appState || {})
    setCurrentFiles(project.data?.files || {})
    setCurrentLibraryItems(project.data?.libraryItems || [])
  }, [project.id])

  // Set up the excalidraw API and mark as initialized
  useEffect(() => {
    if (excalidrawAPI) {
      hasInitialized.current = true
    }
  }, [excalidrawAPI])

  // Handle library URL from hash parameters - only run once when API is ready
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleLibraryFromHash = async () => {
      const hash = window.location.hash
      const addLibraryMatch = hash.match(/[#&]addLibrary=([^&]+)/)
      
      if (addLibraryMatch && excalidrawAPI && hasInitialized.current) {
        const libraryURL = decodeURIComponent(addLibraryMatch[1])
        
        try {
          toast({
            title: "Loading library...",
            description: "Fetching library items from URL",
          })

          const libraryItems = await ProjectManager.fetchLibraryFromURL(libraryURL)
          
          if (libraryItems.length > 0) {
            // Add library items to Excalidraw
            await excalidrawAPI.updateLibrary({
              libraryItems,
              merge: true,
              openLibraryMenu: true,
              defaultStatus: "published"
            })

            toast({
              title: "Library loaded!",
              description: `Added ${libraryItems.length} items to your library`,
            })

            // Clean up the hash but keep the project path
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', `/${project.shortId}`)
            }
          }
        } catch (error) {
          console.error("Error loading library:", error)
          toast({
            title: "Error loading library",
            description: "Failed to load library items from the provided URL",
            variant: "destructive",
          })
        }
      }
    }

    // Only run this once when the API becomes available
    if (excalidrawAPI && hasInitialized.current) {
      handleLibraryFromHash()
    }
  }, [excalidrawAPI, hasInitialized.current, toast, project.shortId])

  // Auto-save when debounced data changes
  useEffect(() => {
    // Skip if we haven't initialized yet
    if (!hasInitialized.current) {
      return
    }

    try {
      console.log('Auto-saving project data...', {
        elements: debouncedElements.length,
        appState: Object.keys(debouncedAppState).length,
        files: Object.keys(debouncedFiles).length,
        libraryItems: debouncedLibraryItems.length
      })
      
      ProjectManager.updateProjectData(project.id, {
        elements: debouncedElements,
        appState: {
          viewBackgroundColor: debouncedAppState.viewBackgroundColor || "#fdf8f6",
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
        libraryItems: debouncedLibraryItems,
      })
    } catch (error) {
      console.error("Error auto-saving project:", error)
    }
  }, [debouncedElements, debouncedAppState, debouncedFiles, debouncedLibraryItems, project.id])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleProjectSelect = (selectedProject: Project) => {
    router.push(`/${selectedProject.shortId}`)
  }

  const excalidrawTheme = theme === "dark" ? THEME.DARK : THEME.LIGHT

  // Memoize Excalidraw component to prevent infinite re-renders
  const ExcalidrawComponent = useMemo(() => (
    <Excalidraw
    // renderCustomStats={() => (
    //       <p style={{ color: "#70b1ec", fontWeight: "bold" }}>
    //         Dummy stats will be shown here
    //       </p>
    //     )}
      UIOptions={{canvasActions:{toggleTheme:false,}}}
      excalidrawAPI={(api) => setExcalidrawAPI(api)}
      initialData={initialData}
      theme={excalidrawTheme}
      name={project.name}
      onChange={(elements, appState, files) => {
        handleElementsChange(elements)
        handleAppStateChange(appState)
        handleFilesChange(files)
      }}
      onLibraryChange={(libraryItems) => {
        handleLibraryChange(libraryItems)
      }}
      renderTopRightUI={() => (
        <div className="flex items-center space-x-2">
          <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">Auto save!</div>
        </div>
      )}
      handleKeyboardGlobally={true}
    />
  ), [initialData, excalidrawTheme, project.name, handleElementsChange, handleAppStateChange, handleFilesChange, handleLibraryChange])

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-default">
                    <h1 className="text-base font-semibold">{project.name}</h1>
                  </div>
                </TooltipTrigger>
                {project.description && (
                  <TooltipContent>
                    <p>{project.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button asChild variant="outline" size="sm" title="Share functionality coming soon">
              <Link href="/export-import">
                <Share2 className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex-1">
          {!isLoading && ExcalidrawComponent}
          <OfflineIndicator />
        </div>
      </div>

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentProject={project}
        onProjectSelect={handleProjectSelect}
        onNewProject={onNewProject}
      />
    </TooltipProvider>
  )
}
