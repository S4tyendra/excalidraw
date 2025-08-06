"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Search, FileText, Plus } from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { searchProjects } from "@/lib/fuzzy-search"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentProject?: Project
  onProjectSelect: (project: Project) => void
  onNewProject: () => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  currentProject,
  onProjectSelect,
  onNewProject,
}: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const router = useRouter()

  // Refresh projects list every time the sidebar opens
  useEffect(() => {
    if (isOpen) {
      const loadedProjects = ProjectManager.getAllProjects()
      setProjects(loadedProjects)
    }
  }, [isOpen])

  useEffect(() => {
    const filtered = searchProjects(projects, searchQuery)
    setFilteredProjects(filtered)
  }, [projects, searchQuery])

  const handleProjectClick = (project: Project) => {
    router.push(`/${project.shortId}`)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b flex-row">
          <Button asChild variant="ghost" onClick={onClose} className="flex">
            <Link href="/">
              <FileText className="w-5 h-5" />
              <SheetTitle className="text-lg font-semibold">Projects</SheetTitle>
            </Link>
          </Button>
        </SheetHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="p-4 border-b">
          <Button onClick={onNewProject} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{searchQuery ? "No projects found" : "No projects yet"}</p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    currentProject?.id === project.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{project.name}</h4>
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{project.shortId}</span>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
