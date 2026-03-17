
import { useEffect } from "react"
import { registerServiceWorker } from "@/lib/service-worker"
import { ProjectManager } from "@/lib/project-manager"
import { useToast } from "@/hooks/use-toast"

interface ServiceWorkerProviderProps {
  children: React.ReactNode
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    // Only register service worker in production or when explicitly enabled
    const shouldRegisterSW = !import.meta.env.DEV

    if (!shouldRegisterSW) {
      console.log('[SW] Service Worker registration skipped in development')
      return
    }

    let isFirstLoad = true

    registerServiceWorker({
      onSuccess: (registration) => {
        console.log('[SW] Service Worker registered successfully')
        
        if (isFirstLoad) {
          toast({
            title: "App is ready for offline use",
            description: "You can now use this app without an internet connection.",
          })
        }
      },
      
      onUpdate: (registration) => {
        console.log('[SW] New app version available')
        
        toast({
          title: "Update available",
          description: "A new version of the app is available. Refresh to update.",
          action: (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80"
            >
              Refresh
            </button>
          ),
        })
      },
      
      onError: (error) => {
        console.error('[SW] Service Worker registration failed:', error)
        
        toast({
          title: "Offline features unavailable",
          description: "Some offline features may not work properly.",
          variant: "destructive",
        })
      },
      
      onOffline: () => {
        toast({
          title: "You're offline",
          description: "Don't worry! The app will continue working with saved data.",
        })
      },
      
      onOnline: async () => {
        toast({
          title: "Back online",
          description: "Connection restored. Syncing your changes...",
        })
        
        // Process offline queue when back online
        try {
          await ProjectManager.processOfflineQueue()
          console.log('[App] Offline queue processed successfully')
        } catch (error) {
          console.error('[App] Error processing offline queue:', error)
          toast({
            title: "Sync issues",
            description: "Some offline changes may not have synced properly.",
            variant: "destructive",
          })
        }
      }
    })

    isFirstLoad = false

    // Check for updates every 30 minutes
    const updateInterval = setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
        }
      } catch (error) {
        console.log('[SW] Update check failed:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes

    // Process offline queue on startup if online
    if (navigator.onLine) {
      ProjectManager.processOfflineQueue().catch(error => {
        console.error('[App] Error processing startup offline queue:', error)
      })
    }

    // Periodically check storage health
    const healthCheckInterval = setInterval(() => {
      const health = ProjectManager.checkStorageHealth()
      if (!health.isHealthy) {
        console.warn('[App] Storage health check failed:', health)
        toast({
          title: "Storage issue detected",
          description: "There may be issues with saving your work. Consider exporting your projects.",
          variant: "destructive",
        })
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      clearInterval(updateInterval)
      clearInterval(healthCheckInterval)
    }
  }, [toast])

  return <>{children}</>
}
