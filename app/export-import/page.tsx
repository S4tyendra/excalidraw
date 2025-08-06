"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Download, 
  Upload, 
  FileText, 
  Check, 
  X, 
  ArrowLeft, 
  AlertCircle,
  Copy,
  Package,
  Database,
  Shield
} from "lucide-react"
import { ProjectManager, type Project } from "@/lib/project-manager"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Head from "next/head"

export default function ExportImportPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [importData, setImportData] = useState("")
  const [importResults, setImportResults] = useState<{
    success: Project[]
    errors: string[]
  }>({ success: [], errors: [] })
  const [showImportResults, setShowImportResults] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadedProjects = ProjectManager.getAllProjects()
    setProjects(loadedProjects)
  }, [])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(new Set(projects.map(p => p.id)))
    } else {
      setSelectedProjects(new Set())
    }
  }

  const handleSelectProject = (projectId: string, checked: boolean) => {
    const newSelected = new Set(selectedProjects)
    if (checked) {
      newSelected.add(projectId)
    } else {
      newSelected.delete(projectId)
    }
    setSelectedProjects(newSelected)
  }

  const handleExportSelected = () => {
    const selectedProjectIds = Array.from(selectedProjects)
    
    if (selectedProjectIds.length === 0) {
      alert("Please select at least one project to export.")
      return
    }

    const exportData = ProjectManager.exportProjects(selectedProjectIds)
    if (!exportData) {
      alert("Failed to export projects.")
      return
    }

    const dataBlob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `excalidraw-projects-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportSingle = (project: Project) => {
    const exportData = ProjectManager.exportProject(project.id)
    if (!exportData) {
      alert("Failed to export project.")
      return
    }

    const dataBlob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${project.shortId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!importData.trim()) {
      alert("Please enter JSON data to import.")
      return
    }

    setIsImporting(true)
    const results: { success: Project[], errors: string[] } = { success: [], errors: [] }

    try {
      const parsedData = JSON.parse(importData)
      
      // Handle bulk export format
      if (parsedData.projects && Array.isArray(parsedData.projects)) {
        for (const projectData of parsedData.projects) {
          try {
            const imported = ProjectManager.importProject(JSON.stringify(projectData))
            if (imported) {
              results.success.push(imported)
            } else {
              results.errors.push(`Failed to import project: ${projectData.name || 'Unknown'}`)
            }
          } catch (error) {
            results.errors.push(`Error importing project: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      } 
      // Handle single project format
      else if (parsedData.id || parsedData.name) {
        const imported = ProjectManager.importProject(importData)
        if (imported) {
          results.success.push(imported)
        } else {
          results.errors.push("Failed to import project")
        }
      }
      // Handle array of projects
      else if (Array.isArray(parsedData)) {
        for (const projectData of parsedData) {
          try {
            const imported = ProjectManager.importProject(JSON.stringify(projectData))
            if (imported) {
              results.success.push(imported)
            } else {
              results.errors.push(`Failed to import project: ${projectData.name || 'Unknown'}`)
            }
          } catch (error) {
            results.errors.push(`Error importing project: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      } else {
        results.errors.push("Invalid JSON format. Expected project data or array of projects.")
      }
    } catch (error) {
      results.errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setImportResults(results)
    setShowImportResults(true)
    setIsImporting(false)

    // Refresh projects list
    const updatedProjects = ProjectManager.getAllProjects()
    setProjects(updatedProjects)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const isAllSelected = projects.length > 0 && selectedProjects.size === projects.length
  const isSomeSelected = selectedProjects.size > 0 && selectedProjects.size < projects.length

  // SEO structured data for export/import functionality
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Export Import Drawing Projects - Backup & Share",
    "description": "Backup your drawing projects or import shared diagrams. Secure JSON export/import for project management and collaboration.",
    "url": typeof window !== "undefined" ? window.location.href : "",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Project Export/Import Tool",
      "applicationCategory": "UtilityApplication",
      "featureList": [
        "Bulk project export",
        "Individual project backup",
        "JSON import from files",
        "Secure data transfer",
        "Project sharing capabilities"
      ]
    }
  }

  return (
    <>
      <Head>
        <title>Export Import Drawing Projects - Backup & Share Your Diagrams | Excalidraw Project Manager</title>
        <meta name="description" content="Backup your drawing projects or import shared diagrams with our secure export/import tool. Perfect for team collaboration and project management." />
        <meta name="keywords" content="export drawing projects, import diagrams, backup drawings, share excalidraw, project backup, diagram export, collaborative drawing" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Export Import Drawing Projects - Backup & Share Your Diagrams" />
        <meta property="og:description" content="Backup your drawing projects or import shared diagrams with our secure export/import tool. Perfect for team collaboration." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ""} />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Export Import Drawing Projects - Backup & Share" />
        <meta name="twitter:description" content="Backup your drawing projects or import shared diagrams with our secure export/import tool." />
        
        {/* Structured Data */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
    <div className="container mx-auto p-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <nav className="flex items-center space-x-2 mb-2" aria-label="Breadcrumb">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Link>
            </Button>
            <span className="text-muted-foreground">•</span>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/features">
                View All Features
              </Link>
            </Button>
          </nav>
          <h1 className="text-3xl font-bold">Export & Import Drawing Projects</h1>
          <p className="text-muted-foreground mt-2">
            Backup your drawing projects, share with team members, or import from other sources
          </p>
          
          {/* SEO benefit highlights */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              Secure JSON backup
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Privacy-first export
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              Bulk operations
            </span>
          </div>
        </div>
      </header>

      <section aria-label="Export and import tools">
        <h2 className="sr-only">Project Export and Import Tools</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export Projects</span>
            </CardTitle>
            <CardDescription>
              Select projects to export as JSON files for backup or sharing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects to export</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    Select All ({projects.length} projects)
                  </Label>
                  {selectedProjects.size > 0 && (
                    <Button 
                      size="sm" 
                      onClick={handleExportSelected}
                      className="ml-auto"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Export Selected ({selectedProjects.size})
                    </Button>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`project-${project.id}`}
                          checked={selectedProjects.has(project.id)}
                          onCheckedChange={(checked) => 
                            handleSelectProject(project.id, checked as boolean)
                          }
                        />
                        <div>
                          <Label htmlFor={`project-${project.id}`} className="font-medium">
                            {project.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            /{project.shortId} • {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportSingle(project)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Import Projects</span>
            </CardTitle>
            <CardDescription>
              Import projects from JSON files or paste JSON data directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Upload JSON File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or paste JSON</span>
              </div>
            </div>

            <div>
              <Label htmlFor="import-data">JSON Data</Label>
              <Textarea
                id="import-data"
                placeholder="Paste your project JSON data here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={6}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <Button 
              onClick={handleImport} 
              disabled={!importData.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? "Importing..." : "Import Projects"}
            </Button>

            {showImportResults && (
              <div className="space-y-3">
                {importResults.success.length > 0 && (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {importResults.success.length} project(s):
                      <ul className="mt-2 space-y-1">
                        {importResults.success.map((project) => (
                          <li key={project.id} className="flex items-center justify-between">
                            <span className="text-sm">
                              {project.name} (/{project.shortId})
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/${project.shortId}`)}
                            >
                              Open
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {importResults.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {importResults.errors.length} error(s) occurred:
                      <ul className="mt-2 space-y-1">
                        {importResults.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowImportResults(false)
                    setImportData("")
                    setImportResults({ success: [], errors: [] })
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Results
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </section>

      {/* Export Format Documentation */}
      <section aria-label="Documentation">
        <Card className="mt-8">
        <CardHeader>
          <CardTitle>Export Format Guide - JSON Structure for Drawing Projects</CardTitle>
          <CardDescription>
            Learn about our JSON export format for backing up and sharing your drawing projects securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3 text-lg">Bulk Export Format for Multiple Projects:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When exporting multiple projects, they are packaged in a structured JSON format with metadata for easy restoration.
              </p>
              <div className="relative">
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "version": "1.0",
  "exportDate": "2025-08-06T12:00:00.000Z",
  "projects": [
    {
      "id": "...",
      "shortId": "abc123",
      "name": "My Project",
      "description": "Project description",
      "createdAt": "2025-08-06T12:00:00.000Z",
      "updatedAt": "2025-08-06T12:00:00.000Z",
      "data": {
        "elements": [...],
        "appState": {...},
        "libraryItems": [...]
      }
    }
  ]
}`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`{
  "version": "1.0",
  "exportDate": "2025-08-06T12:00:00.000Z",
  "projects": [...]
}`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3 text-lg">Single Project Export Format:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Individual projects are exported with complete drawing data, metadata, and timestamps for full restoration.
              </p>
              <div className="relative">
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "id": "...",
  "shortId": "abc123",
  "name": "My Project",
  "description": "Project description",
  "createdAt": "2025-08-06T12:00:00.000Z",
  "updatedAt": "2025-08-06T12:00:00.000Z",
  "data": {
    "elements": [...],
    "appState": {...},
    "libraryItems": [...]
  }
}`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`{
  "id": "...",
  "shortId": "abc123",
  "name": "My Project",
  ...
}`)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy & Security:</strong> All exports are processed locally in your browser. No data is sent to external servers. When importing, new unique IDs are generated automatically to prevent conflicts with existing projects.
              </AlertDescription>
            </Alert>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Why Use Our Export/Import Feature?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Backup your valuable drawing projects securely</li>
                <li>Share project files with team members</li>
                <li>Migrate projects between different instances</li>
                <li>Version control for your diagrams and sketches</li>
                <li>Collaborate on complex drawing projects</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </section>
    </div>
    </>
  )
}