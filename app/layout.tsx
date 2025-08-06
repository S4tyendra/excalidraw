import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Free Online Drawing Tool - Excalidraw Project Manager | Create Diagrams & Sketches",
    template: "%s | Excalidraw Project Manager"
  },
  description: "Free enhanced Excalidraw with project management for those who need organized drawing tools but can't afford premium subscriptions. Create diagrams, wireframes, and collaborative sketches with advanced project organization, export/import, and more.",
  keywords: [
    "excalidraw", "drawing tool", "diagram maker", "wireframe tool", 
    "collaborative drawing", "online sketching", "project management", 
    "free drawing app", "whiteboard", "visual collaboration", "design tool",
    "flowchart maker", "mockup tool", "brainstorming tool", "affordable design tools",
    "free excalidraw alternative", "budget-friendly drawing app", "accessible design software",
    "excalidraw enhanced", "organized drawing projects"
  ],
  authors: [{ name: "Satyendra", url: "https://github.com/s4tyendra" }],
  creator: "Satyendra (s4tyendra)",
  publisher: "DEVH",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://excalidraw.devh.in",
    siteName: "Excalidraw Project Manager",
    title: "Free Online Drawing Tool - Create Diagrams & Sketches",
    description: "Create beautiful diagrams, wireframes, and collaborative sketches with our free online drawing tool. Perfect for teams and individuals.",
    images: [
      {
        url: "/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: "Excalidraw Project Manager - Free Online Drawing Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Drawing Tool - Excalidraw Project Manager",
    description: "Create beautiful diagrams, wireframes, and collaborative sketches with our free online drawing tool.",
    images: ["/placeholder-logo.png"],
    creator: "@s4tyendra",
  },
  icons: {
    icon: "/placeholder-logo.png",
    shortcut: "/placeholder-logo.png",
    apple: "/placeholder-logo.png",
  },
  manifest: "/manifest.json",
  category: "productivity",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily}, ${inter.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
