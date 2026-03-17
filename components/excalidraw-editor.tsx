
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Excalidraw, THEME } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon, Share2 } from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import {  useNavigate  } from 'react-router-dom'
import { useDebounce } from "@/hooks/use-debounce"
import { ProjectSidebar } from "./project-sidebar"
import { OfflineIndicator } from "./offline-indicator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { tr } from "date-fns/locale"
import {  Link  } from 'react-router-dom'
import { CloudSync } from "@/lib/cloud-sync"
import { ShareDialog } from "./share-dialog"

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
  const [saveStatus, setSaveStatus] = useState<"idle" | "pending" | "syncing" | "saved">("idle")
  const [isShareOpen, setIsShareOpen] = useState(false)
  const hasInitialized = useRef(false)
  const syncAbortRef = useRef<AbortController | null>(null)
  const { toast } = useToast()
  const router = useNavigate()
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

  // 2-second debounce — gives user time to finish a stroke before saving
  const debouncedElements = useDebounce(currentElements, 2000)
  const debouncedAppState = useDebounce(currentAppState, 2000)
  const debouncedFiles = useDebounce(currentFiles, 2000)
  const debouncedLibraryItems = useDebounce(currentLibraryItems, 2000)

  // Handle Excalidraw changes — mark pending on every raw change
  const handleElementsChange = useCallback((elements: readonly any[]) => {
    if (!hasInitialized.current) return
    setCurrentElements([...elements])
    setSaveStatus("pending")
  }, [])

  const handleAppStateChange = useCallback((appState: any) => {
    if (!hasInitialized.current) return
    setCurrentAppState(appState)
  }, [])

  const handleFilesChange = useCallback((files: any) => {
    if (!hasInitialized.current) return
    setCurrentFiles(files)
    setSaveStatus("pending")
  }, [])

  const handleLibraryChange = useCallback((libraryItems: readonly any[]) => {
    if (!hasInitialized.current) return
    setCurrentLibraryItems([...libraryItems])
    setSaveStatus("pending")
  }, [])


  const pendingServerData = useRef<any>(null)

  useEffect(() => {
    setIsLoading(false)
    hasInitialized.current = false // Reset for new project
    pendingServerData.current = null
    
    // Reset state when project changes
    setCurrentElements(project.data?.elements || [])
    setCurrentAppState(project.data?.appState || {})
    setCurrentFiles(project.data?.files || {})
    setCurrentLibraryItems(project.data?.libraryItems || [])

    // Cloud Sync: when user opens a project, if online, get data from server and merge
    if (typeof navigator !== 'undefined' && navigator.onLine && CloudSync.getSession()) {
      CloudSync.fetchFullProject(project.id).then((fullData) => {
        // fullData.data is already parsed (JSON.parse done inside fetchFullProject)
        if (!fullData || !fullData.data) return;

        const serverTs = Number(fullData.last_edited_ts);
        const localTs = new Date(project.updatedAt).getTime();

        // Only bother merging if server has something newer or different
        const mergedElements = CloudSync.mergeElements(
          project.data?.elements || [],
          fullData.data.elements || []
        );
        const mergedFiles = CloudSync.mergeFiles(
          project.data?.files || {},
          fullData.data.files || {}
        );
        const mergedLibraryItems = [
          ...(project.data?.libraryItems || []),
          ...(fullData.data.libraryItems || []),
        ].filter((v, i, a) => a.findIndex((v2: any) => v2.id === v.id) === i);
        const mergedAppState = {
          ...(project.data?.appState || {}),
          ...(fullData.data.appState || {}),
        };

        setCurrentElements(mergedElements);
        setCurrentFiles(mergedFiles);
        setCurrentLibraryItems(mergedLibraryItems);
        setCurrentAppState(mergedAppState);

        // If API already initialized, push immediately; otherwise store for API init effect
        if (excalidrawAPI && hasInitialized.current) {
          excalidrawAPI.updateScene({ elements: mergedElements, appState: mergedAppState });
          const fileValues = Object.values(mergedFiles);
          if (fileValues.length > 0) {
            excalidrawAPI.addFiles(fileValues);
          }
        } else {
          pendingServerData.current = { elements: mergedElements, appState: mergedAppState, files: mergedFiles };
        }

        // Persist merged data locally
        ProjectManager.updateProjectData(project.id, {
          elements: mergedElements,
          appState: mergedAppState,
          files: mergedFiles,
          libraryItems: mergedLibraryItems,
        });
      }).catch((e) => console.error("Failed to sync project from server", e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  // Set up the excalidraw API and mark as initialized
  // If server data arrived before API was ready, push it now
  useEffect(() => {
    if (excalidrawAPI) {
      hasInitialized.current = true
      if (pendingServerData.current) {
        const { elements, appState, files } = pendingServerData.current;
        excalidrawAPI.updateScene({ elements, appState });
        const fileValues = Object.values(files);
        if (fileValues.length > 0) {
          excalidrawAPI.addFiles(fileValues);
        }
        pendingServerData.current = null;
      }
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
    if (!hasInitialized.current) return

    // Abort any in-flight upload before starting a new one
    if (syncAbortRef.current) {
      syncAbortRef.current.abort()
    }
    const abortController = new AbortController()
    syncAbortRef.current = abortController

    try {
      const savedData = {
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
      }

      // Local save is always synchronous and instant
      ProjectManager.updateProjectData(project.id, savedData)

      // Cloud sync: abort-aware fire-and-forget
      if (typeof navigator !== 'undefined' && navigator.onLine && CloudSync.getSession()) {
        setSaveStatus("syncing")
        const latestProject = ProjectManager.getProject(project.id)
        if (latestProject) {
          CloudSync.uploadProject({ ...latestProject, data: savedData }, abortController.signal)
            .then((ok) => {
              if (abortController.signal.aborted) return
              setSaveStatus("saved")
            })
            .catch((err) => {
              if (abortController.signal.aborted) return
              console.error("Cloud sync failed:", err)
              setSaveStatus("saved") // still saved locally
            })
        } else {
          setSaveStatus("saved")
        }
      } else {
        setSaveStatus("saved")
      }
    } catch (error) {
      console.error("Error auto-saving project:", error)
      setSaveStatus("pending")
    }

  }, [debouncedElements, debouncedAppState, debouncedFiles, debouncedLibraryItems, project.id])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleProjectSelect = (selectedProject: Project) => {
    navigate(`/${selectedProject.shortId}`)
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
                  <div className="cursor-default flex items-center gap-2">
                    <h1 className="text-base font-semibold">{project.name}</h1>
                    {/* Save status dot — lives here in our header, always reactive */}
                    {saveStatus === "pending" && (
                      <span className="w-2 h-2 rounded-full bg-orange-400" title="Pending changes" />
                    )}
                    {saveStatus === "syncing" && (
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" title="Syncing..." />
                    )}
                    {saveStatus === "saved" && (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Saved" />
                    )}
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
            {CloudSync.getSession() && (
              <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)} title="Share project">
                <Share2 className="w-4 h-4" />
              </Button>
            )}
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

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </TooltipProvider>
  )
}
