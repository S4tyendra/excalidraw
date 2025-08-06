"use client"

import dynamic from "next/dynamic"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"

// Dynamically import components that use browser APIs
const InstallPrompt = dynamic(() => import("@/components/install-prompt").then(mod => ({ default: mod.InstallPrompt })), {
  ssr: false
})

const OfflineIndicator = dynamic(() => import("@/components/offline-indicator").then(mod => ({ default: mod.OfflineIndicator })), {
  ssr: false
})

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ServiceWorkerProvider>
      {children}
      <InstallPrompt />
      <OfflineIndicator />
    </ServiceWorkerProvider>
  )
}
