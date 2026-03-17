
import { lazy, Suspense } from 'react'
import { ServiceWorkerProvider } from "@/components/service-worker-provider"

const InstallPromptLoader = lazy(() => import("@/components/install-prompt").then(mod => ({ default: mod.InstallPrompt })))
const InstallPrompt = (props: any) => <Suspense fallback={null}><InstallPromptLoader {...props} /></Suspense>

const OfflineIndicatorLoader = lazy(() => import("@/components/offline-indicator").then(mod => ({ default: mod.OfflineIndicator })))
const OfflineIndicator = (props: any) => <Suspense fallback={null}><OfflineIndicatorLoader {...props} /></Suspense>

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
