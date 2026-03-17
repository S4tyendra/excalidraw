
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, FileText, Sun, Moon, Search, Palette, EllipsisVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { useTheme } from "next-themes"
import {  useNavigate, useLocation  } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { searchProjects } from "@/lib/fuzzy-search"
import {  Link  } from 'react-router-dom'

import Signin from "@/components/signin"

import { CloudSync } from "@/lib/cloud-sync"

const ExcalidrawEditorLoader = lazy(() => import("@/components/excalidraw-editor")); const ExcalidrawEditor = (props: any) => <Suspense fallback={<div/>}><ExcalidrawEditorLoader {...props} /></Suspense>

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({ name: "", description: "" })
  const { theme, setTheme } = useTheme()
  const router = useNavigate()
  const pathname = useLocation().pathname
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])

  useEffect(() => {
    const filtered = searchProjects(projects, searchQuery)
    setFilteredProjects(filtered)
  }, [projects, searchQuery])

  useEffect(() => {
    // Only load from local storage on mount — no server fetch here.
    // Per-project server sync happens in ExcalidrawEditor when a project is opened.
    setProjects(ProjectManager.getAllProjects())
  }, [])

  // Check for shortId in pathname whenever it changes
  useEffect(() => {
    const shortId = pathname.slice(1) // Remove leading slash

    if (shortId) {
      const project = ProjectManager.getProjectByShortId(shortId)
      if (project) {
        setSelectedProject(project)
      } else {
        // Project not found, redirect to home
        navigate('/')
      }
    } else {
      setSelectedProject(null)
    }
  }, [pathname, router])

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project = ProjectManager.createProject(newProject.name, newProject.description)
    setProjects(ProjectManager.getAllProjects())
    setNewProject({ name: "", description: "" })
    setIsCreateDialogOpen(false)

    // Fire-and-forget: upload to server if logged in
    if (CloudSync.getSession()) {
      CloudSync.uploadProject(project).catch(console.error)
    }

    navigate(`/${project.shortId}`)
  }

  const handleUpdateProject = () => {
    if (!editingProject || !editingProject.name.trim()) return

    ProjectManager.updateProject(editingProject.id, {
      name: editingProject.name,
      description: editingProject.description,
    })
    const updated = ProjectManager.getProject(editingProject.id)
    setProjects(ProjectManager.getAllProjects())
    setIsEditDialogOpen(false)
    setEditingProject(null)

    // Fire-and-forget: sync rename to server
    if (updated && CloudSync.getSession()) {
      CloudSync.uploadProject(updated).catch(console.error)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      ProjectManager.deleteProject(projectId)
      setProjects(ProjectManager.getAllProjects())
      if (selectedProject?.id === projectId) {
        navigate('/')
      }
      // Fire-and-forget: delete from server if logged in
      if (CloudSync.getSession()) {
        CloudSync.deleteServerProject(projectId).catch(console.error)
      }
    }
  }

  const handleOpenProject = (project: Project) => {
    navigate(`/${project.shortId}`)
  }

  const handleProjectChange = (project: Project) => {
    // This is called when the project data changes in the editor
    // We might want to update the projects list if metadata changed
    const updatedProjects = ProjectManager.getAllProjects()
    setProjects(updatedProjects)
  }

  const handleNewProjectFromEditor = () => {
    setIsCreateDialogOpen(true)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // SEO structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Excalidraw Project Manager",
    "description": "Free online collaborative drawing tool with project management. Create diagrams, wireframes, and sketches with ease.",
    "url": "https://excalidraw.devh.in",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Person",
      "name": "Satyendra",
      "alternateName": "s4tyendra"
    },
    "featureList": [
      "Collaborative drawing and diagramming",
      "Project management and organization",
      "Export and import functionality",
      "Real-time collaboration",
      "Dark and light themes",
      "Search and filter projects"
    ]
  }

  return (
    <>
      <></>
      {selectedProject ? (
        <ExcalidrawEditor
          project={selectedProject}
          onProjectChange={handleProjectChange}
          onNewProject={handleNewProjectFromEditor}
        />
      ) : (
        <div className="container mx-auto p-6" suppressHydrationWarning>
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold">Free Online Drawing Tool - Excalidraw</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Create beautiful diagrams, wireframes, and collaborative sketches. Manage multiple drawing projects with ease.
              </p>
              {/* SEO-optimized subtitle */}
              <div className="mt-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Professional diagramming tool for designers, developers, and teams
                </p>
              </div>
            </div>

            <nav className="flex items-center space-x-2" aria-label="Main navigation">
              <Button variant="outline" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Button onClick={() => setIsCreateDialogOpen(true)} aria-label="Create new project">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More options">
                    <EllipsisVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <a href="/export-import">Export / Import</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/shared-links">Shared Links</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/features">Features</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Signin />
            </nav>
          </header>

          <section aria-label="Project search">
            <div className="p-4 border-b mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search your drawing projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search projects"
                />
              </div>
            </div>
          </section>

          <main>
            {projects.length === 0 ? (
              <section className="text-center py-12" aria-label="No projects state">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Start Your First Drawing Project</h2>
                <p className="text-muted-foreground mb-4">
                  Create professional diagrams, wireframes, and collaborative sketches. Perfect for UI/UX design, system architecture, and visual brainstorming.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </section>
            ) : filteredProjects.length === 0 && searchQuery ? (
              <section className="text-center py-12" aria-label="No search results">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">No Projects Found</h2>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search query or create a new project with that name.
                </p>
              </section>
            ) : (
              <section aria-label="Project list">
                <h2 className="sr-only">Your Drawing Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                  {filteredProjects.map((project) => (
                    <article key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" role="listitem">
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1" onClick={() => handleOpenProject(project)}>
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                  /{project.shortId}
                                </span>
                              </div>
                              <CardDescription className="mt-2">{project.description || "No description"}</CardDescription>
                            </div>
                            <div className="flex space-x-1" role="group" aria-label="Project actions">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingProject(project)
                                  setIsEditDialogOpen(true)
                                }}
                                aria-label={`Edit project ${project.name}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteProject(project.id)
                                }}
                                aria-label={`Delete project ${project.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent onClick={() => handleOpenProject(project)}>
                          <div className="text-sm text-muted-foreground">
                            Created: <time dateTime={project.createdAt}>{new Date(project.createdAt).toLocaleDateString()}</time>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Modified: <time dateTime={project.updatedAt}>{new Date(project.updatedAt).toLocaleDateString()}</time>
                          </div>
                        </CardContent>
                      </Card>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>
          
          <footer className="mt-16 pt-8 border-t text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} Satyendra. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/terms" className="hover:underline">Terms</Link>
              <Link to="/contact" className="hover:underline">Contact</Link>
            </div>
          </footer>
        </div>
      )}

      {/* Dialogs that should always be available */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Give your project a name and description to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Enter project description (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project name and description.</DialogDescription>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateProject}>Update Project</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
