
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CloudSync } from "@/lib/cloud-sync"
import { ShareDB } from "@/lib/share-db"
import { Share2, Copy, ExternalLink, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export function ShareDialog({ open, onOpenChange, projectId, projectName }: ShareDialogProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ shareUrl: string; slug: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await CloudSync.shareProject(projectId)
      if (!data) {
        setError("Failed to create share link. Make sure you are signed in and the project is synced.")
        return
      }
      setResult(data)
      // Persist locally in IndexedDB
      await ShareDB.save({
        slug: data.slug,
        shareUrl: data.shareUrl,
        projectId,
        projectName,
        createdAt: new Date().toISOString(),
      })
    } catch (e) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share "{projectName}"
          </DialogTitle>
          <DialogDescription>
            Creates a permanent public snapshot. Future edits will <strong>not</strong> be reflected.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 flex gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Share links are <strong>public</strong> and permanent. Never include sensitive information in shared projects.
                Links cannot be deleted — contact <a href="mailto:satya@satyendra.in" className="underline">satya@satyendra.in</a> for removal.
              </span>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleShare} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
                Create Share Link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-3 flex gap-2 text-sm text-green-800 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              Share link created and saved locally! View all links at <strong>/shared-links</strong>.
            </div>
            <div className="flex gap-2">
              <Input readOnly value={result.shareUrl} className="text-xs font-mono" />
              <Button size="icon" variant="outline" onClick={handleCopy} title="Copy link">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="outline" asChild title="Open in new tab">
                <a href={result.shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
