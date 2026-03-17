
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {  Link  } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <nav className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
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
          <h2 className="text-2xl font-semibold mb-4">3. User Content & API Policy</h2>
          <div className="bg-muted p-4 rounded-lg mb-6 text-sm border-l-4 border-primary">
            <strong>TL;DR:</strong> Your data, your legal liability. Do not attack our APIs. CSAM gets you instantly nuked.
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="font-bold text-primary shrink-0">•</span>
              <p>
                <strong>Content & Liability:</strong> We do not monitor, endorse, or give a damn about what you store, sync, or draw. Whether it is adult material, illegal content, or anything else, you assume 100% of the legal liability. We are not responsible for any data loss under any circumstances.
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="font-bold text-primary shrink-0">•</span>
              <p>
                <strong>API Usage:</strong> Do not abuse, exploit, or launch attacks against our infrastructure. The codebase is open source. Contribute to it responsibly instead of acting like a malicious idiot.
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="font-bold text-destructive shrink-0">•</span>
              <p>
                <strong>Zero Tolerance:</strong> The single absolute prohibition is child sexual abuse material (CSAM). Any such content will be automatically and permanently deleted without notice.
              </p>
            </div>
          </div>
          
          <p className="mt-6 font-bold text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/5">
            Any violation of the API or CSAM rules will result in immediate termination of your access.
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
