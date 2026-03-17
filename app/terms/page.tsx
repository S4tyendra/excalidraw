"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
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

      <article className="prose dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Excalidraw Project Manager, you agree to be bound by these Terms of Service. If you do not agree with any part of the terms, you must not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            Excalidraw Project Manager is built on top of the open-source Excalidraw editor. It adds cloud sync, persistent local storage, and project management.
            The service is provided "as is" and "as available".
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
          <p>
            You retain full ownership of all drawings and data you create on the platform. The platform claims no intellectual property rights over the material you provide to the service.
          </p>
          <p className="mt-4 text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-900/10 p-4 rounded-md">
            Warning: The creator of the site does not care about what you draw or what data you sync, nor can they be held responsible for your data loss. 
            Do not draw or host illegal material using the Cloud Sync or Share Link features. 
            Any violation or abuse will result in immediate termination without warning and reporting to authorities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. "Public" Share Links</h2>
          <p>
            Generating a share link uploads a snapshot of your project to our content delivery endpoints. This link is public to anyone who receives it. You assume all risks involved in sharing content via this platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Disclaimer of Warranty</h2>
          <p>
            The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Attribution</h2>
          <p>
            This application is built with the exceptional open-source <strong>@excalidraw/excalidraw</strong> package. All core drawing features belong to the Excalidraw team.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <p>
            For questions about these Terms, contact us at: <a href="mailto:satya@satyendra.in" className="text-blue-500 hover:underline">satya@satyendra.in</a>.
          </p>
        </section>
      </article>
    </div>
  )
}
