"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Github, Globe } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <nav className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </nav>

      <article className="prose dark:prose-invert max-w-none text-center">
        <h1 className="text-4xl font-bold mb-4">Contact Me</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Feel free to reach out if you have any questions, feedback, or issues.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 border-y border-border py-10">
          <a
            href="mailto:satya@satyendra.in"
            className="flex flex-col items-center justify-center space-y-3 p-4 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Email</h3>
              <p className="text-sm text-muted-foreground">satya@satyendra.in</p>
            </div>
          </a>

          <a
            href="https://satyendra.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center space-y-3 p-4 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Website</h3>
              <p className="text-sm text-muted-foreground">satyendra.in</p>
            </div>
          </a>

          <a
            href="https://github.com/S4tyendra"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center space-y-3 p-4 hover:bg-accent/50 rounded-lg transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Github className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">GitHub</h3>
              <p className="text-sm text-muted-foreground">@S4tyendra</p>
            </div>
          </a>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          This project relies on the open-source Excalidraw editor. If you find value in Excalidraw,
          please consider supporting the original developers by starring their{" "}
          <a href="https://github.com/excalidraw/excalidraw" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">repository</a>.
        </p>
      </article>
    </div>
  )
}
