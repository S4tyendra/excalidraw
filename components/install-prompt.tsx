
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, Smartphone, Monitor } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    if (typeof window === 'undefined') return

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isIOSStandalone)

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios')
    } else if (/android/.test(userAgent)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed')
        const lastDismissed = dismissed ? parseInt(dismissed) : 0
        const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24)
        
        // Only show if not dismissed in the last 7 days
        if (daysSinceDismissed > 7) {
          setShowPrompt(true)
        }
      }, 3000) // Wait 3 seconds after page load
    }

    // Handle app installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
      } else {
        console.log('[PWA] User dismissed the install prompt')
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('[PWA] Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  // Don't show if not client-side, already installed or no prompt available
  if (!isClient || isInstalled || !showPrompt) {
    return null
  }

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          icon: <Smartphone className="h-5 w-5" />,
          title: "Install Excalidraw App",
          description: "Add to your home screen for the best experience",
          instructions: "Tap the Share button, then 'Add to Home Screen'"
        }
      case 'android':
        return {
          icon: <Smartphone className="h-5 w-5" />,
          title: "Install Excalidraw App",
          description: "Install as an app for offline access and faster loading",
          instructions: deferredPrompt ? "Click 'Install' to add to your device" : "Use browser menu to 'Add to Home screen'"
        }
      default:
        return {
          icon: <Monitor className="h-5 w-5" />,
          title: "Install Excalidraw App",
          description: "Install as a desktop app for the best experience",
          instructions: "Install for offline access, faster loading, and desktop integration"
        }
    }
  }

  const { icon, title, description, instructions } = getInstallInstructions()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            {instructions}
          </p>
          <div className="flex gap-2">
            {deferredPrompt && (
              <Button onClick={handleInstall} size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleDismiss}
              size="sm"
              className={deferredPrompt ? "flex-1" : "w-full"}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
