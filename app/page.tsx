"use client"

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
import { Plus, Edit, Trash2, FileText, Sun, Moon, Search, Palette, Share2, Layers } from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { useTheme } from "next-themes"
import { useRouter, usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { searchProjects } from "@/lib/fuzzy-search"
import Link from "next/link"
import Head from "next/head"

const ExcalidrawEditor = dynamic(() => import("@/components/excalidraw-editor"), { ssr: false })

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({ name: "", description: "" })
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])

  useEffect(() => {
    const filtered = searchProjects(projects, searchQuery)
    setFilteredProjects(filtered)
  }, [projects, searchQuery])

  useEffect(() => {
    const loadedProjects = ProjectManager.getAllProjects()
    setProjects(loadedProjects)
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
        router.push('/')
      }
    } else {
      setSelectedProject(null)
    }
  }, [pathname, router])

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project = ProjectManager.createProject(newProject.name, newProject.description)
    const updatedProjects = ProjectManager.getAllProjects()
    setProjects(updatedProjects)
    setNewProject({ name: "", description: "" })
    setIsCreateDialogOpen(false)

    // Navigate to the new project using Next.js router
    router.push(`/${project.shortId}`)
  }

  const handleUpdateProject = () => {
    if (!editingProject || !editingProject.name.trim()) return

    ProjectManager.updateProject(editingProject.id, {
      name: editingProject.name,
      description: editingProject.description,
    })
    setProjects(ProjectManager.getAllProjects())
    setIsEditDialogOpen(false)
    setEditingProject(null)
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      ProjectManager.deleteProject(projectId)
      const updatedProjects = ProjectManager.getAllProjects()
      setProjects(updatedProjects)
      if (selectedProject?.id === projectId) {
        router.push('/')
      }
    }
  }

  const handleOpenProject = (project: Project) => {
    router.push(`/${project.shortId}`)
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
    "url": typeof window !== "undefined" ? window.location.origin : "https://excalidraw.devh.in",
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
      <Head>
        <title>Free Online Drawing Tool - Excalidraw Project Manager | Create Diagrams & Sketches</title>
        <meta name="description" content="Create beautiful diagrams, wireframes, and sketches with our free online collaborative drawing tool. Manage multiple projects, export/import, and collaborate in real-time." />
        <meta name="keywords" content="excalidraw, drawing tool, diagram maker, wireframe tool, collaborative drawing, online sketching, project management, free drawing app, whiteboard, visual collaboration" />
        <meta name="author" content="Satyendra (s4tyendra)" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free Online Drawing Tool - Excalidraw Project Manager" />
        <meta property="og:description" content="Create beautiful diagrams, wireframes, and sketches with our free online collaborative drawing tool. Manage multiple projects and collaborate in real-time." />
        <meta property="og:image" content="/placeholder-logo.png" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ""} />
        <meta property="og:site_name" content="Excalidraw Project Manager" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Online Drawing Tool - Excalidraw Project Manager" />
        <meta name="twitter:description" content="Create beautiful diagrams, wireframes, and sketches with our free online collaborative drawing tool." />
        <meta name="twitter:image" content="/placeholder-logo.png" />
        <meta name="twitter:creator" content="@s4tyendra" />

        {/* Additional SEO */}
        <meta name="theme-color" content="#3b82f6" />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : ""} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
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
              <h1 className="text-3xl font-bold">Free Online Drawing Tool - Excalidraw</h1>
              <p className="text-muted-foreground mt-2">
                Create beautiful diagrams, wireframes, and collaborative sketches. Manage multiple drawing projects with ease.
              </p>
              {/* SEO-optimized subtitle */}
              <div className="mt-4 text-sm text-muted-foreground">
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

              <Button asChild variant="outline" size="sm">
                <Link href="/export-import" aria-label="Export and import projects">
                  <Share2 className="w-4 h-4 mr-2" />
                  Export/Import
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm">
                <Link href="/features" aria-label="View feature comparison">
                  <Layers className="w-4 h-4 mr-2" />
                  Features
                </Link>
              </Button>
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
  <footer className="fixed bottom-0 items-left left-0 right-0 m-12 text-left text-sm text-muted-foreground">
        <section className="mb-8 p-6 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Excalidraw - DevH</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/features">
                View All Features
                <Layers className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Layers className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Project Management</h3>
                <p className="text-muted-foreground">Organize and manage multiple drawing projects efficiently</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Share2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Export & Import</h3>
                <p className="text-muted-foreground">Backup and share your projects with JSON export/import</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Search className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Smart Search</h3>
                <p className="text-muted-foreground">Find your projects quickly with intelligent search</p>
              </div>
            </div>
          </div>
        </section>
      </footer>
    </>
  )
}
