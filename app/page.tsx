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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, FileText, Sun, Moon } from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import { useTheme } from "next-themes"
import dynamic from "next/dynamic"

const ExcalidrawEditor = dynamic(() => import("@/components/excalidraw-editor"), { ssr: false })

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({ name: "", description: "" })
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const loadedProjects = ProjectManager.getAllProjects()
    setProjects(loadedProjects)
  }, [])

  // Check for hash in URL on component mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const project = ProjectManager.getProjectByShortId(hash)
      if (project) {
        setSelectedProject(project)
      }
    }
  }, [])

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        const project = ProjectManager.getProjectByShortId(hash)
        if (project) {
          setSelectedProject(project)
        }
      } else {
        setSelectedProject(null)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project = ProjectManager.createProject(newProject.name, newProject.description)
    setProjects(ProjectManager.getAllProjects())
    setNewProject({ name: "", description: "" })
    setIsCreateDialogOpen(false)
    setSelectedProject(project)
    window.location.hash = project.shortId
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
      setProjects(ProjectManager.getAllProjects())
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
        window.location.hash = ""
      }
    }
  }

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project)
    window.location.hash = project.shortId
  }

  const handleProjectChange = (project: Project) => {
    setSelectedProject(project)
  }

  const handleNewProjectFromEditor = () => {
    setIsCreateDialogOpen(true)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (selectedProject) {
    return (
      <ExcalidrawEditor
        project={selectedProject}
        onProjectChange={handleProjectChange}
        onNewProject={handleNewProjectFromEditor}
      />
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Excalidraw Projects</h1>
          <p className="text-muted-foreground mt-2">Create and manage your drawing projects</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
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
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first drawing project to get started.</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1" onClick={() => handleOpenProject(project)}>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        #{project.shortId}
                      </span>
                    </div>
                    <CardDescription className="mt-2">{project.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProject(project)
                        setIsEditDialogOpen(true)
                      }}
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
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent onClick={() => handleOpenProject(project)}>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Modified: {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  )
}
