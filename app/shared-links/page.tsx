
import { useEffect, useState } from "react"
import { ShareDB, SharedLink } from "@/lib/share-db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ExternalLink, Trash2, Link2, ArrowLeft, CheckCircle2 } from "lucide-react"
import {  Link  } from 'react-router-dom'

export default function SharedLinksPage() {
  const [links, setLinks] = useState<SharedLink[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    ShareDB.getAll().then((all) => {
      setLinks(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
  }, [])

  const handleCopy = (url: string, slug: string) => {
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = async (slug: string) => {
    await ShareDB.delete(slug)
    setLinks((prev) => prev.filter((l) => l.slug !== slug))
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Shared Links</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Public snapshots you've created. Stored locally — only you can see this list.
          </p>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No shared links yet</p>
          <p className="text-sm mt-1">Open a project and use the share button to create a public snapshot.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <Card key={link.slug}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{link.projectName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shared on {new Date(link.createdAt).toLocaleString()} &middot;{" "}
                      <span className="font-mono">{link.slug}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(link.slug)}
                    title="Remove from local list (does not delete the link)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md truncate font-mono">
                    {link.shareUrl}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(link.shareUrl, link.slug)}
                    title="Copy link"
                  >
                    {copied === link.slug
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="outline" asChild title="Open link">
                    <a href={link.shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is a permanent snapshot. Deleting it from this list only removes it from your local view — the link remains active.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
