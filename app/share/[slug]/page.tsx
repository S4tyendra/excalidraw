
import { lazy, Suspense } from 'react'
import {  useParams  } from 'react-router-dom'

// Excalidraw must be loaded dynamically without SSR
const SharedViewerLoader = lazy(() => import("./shared-viewer")); const SharedViewer = (props: any) => <Suspense fallback={<div/>}><SharedViewerLoader {...props} /></Suspense>

export default function SharePage() {
  const params = useParams()
  return <SharedViewer slug={params.slug as string} />
}
