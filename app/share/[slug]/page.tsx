"use client"

import dynamic from "next/dynamic"
import { useParams } from "next/navigation"

// Excalidraw must be loaded dynamically without SSR
const SharedViewer = dynamic<{ slug: string }>(() => import("./shared-viewer"), { ssr: false })

export default function SharePage() {
  const params = useParams()
  return <SharedViewer slug={params.slug as string} />
}
