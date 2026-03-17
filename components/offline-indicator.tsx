
import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check initial state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)
      // Hide the indicator after 3 seconds when back online
      setTimeout(() => setShowIndicator(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Don't render on server
  if (!isClient) return null

  // Always show when offline, conditionally show when online
  const shouldShow = !isOnline || showIndicator

  if (!shouldShow) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-lg transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-red-500 text-white",
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline mode</span>
        </>
      )}
    </div>
  )
}
