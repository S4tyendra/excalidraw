
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {  Link  } from 'react-router-dom'

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Data Collection and Storage</h2>
          <p className="mb-4">
            <strong>Local Storage (Free Version):</strong> By default, all your drawings, projects, and metadata are stored entirely locally in your browser's LocalStorage and IndexedDB. None of this data is transmitted to our servers.
          </p>
          <p className="mb-4">
            <strong>Cloud Sync (Authenticated Users):</strong> If you choose to authenticate via GitHub, we store your profile information (Name, Email, GitHub ID) and your project data (encrypted in transit and at rest) to enable syncing across devices. Your drawing data remains private and is only accessible via your authenticated session.
          </p>
          <p>
            <strong>Shared Links:</strong> If you explicitly choose to create a public Share Link for a project, a frozen snapshot of that project's data is uploaded to a public storage bucket. Anyone with the generated URL (slug) can access this snapshot. Never share sensitive information in publicly shared projects.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Authentication</h2>
          <p>
            We use GitHub for authentication via OAuth. We only request basic profile access (user:email) to identify you and associate your projects with your account. We do not have access to your repositories or code.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Third-Party Services</h2>
          <p className="mb-2">We utilize the following third-party infrastructure:</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Cloudflare Workers:</strong> For our API and serverless compute.</li>
            <li><strong>Turso (SQLite):</strong> For database storage of user metadata and synced projects.</li>
            <li><strong>R2 / External Asset Storage:</strong> For hosting images embedded in your synced or shared projects.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Deletion</h2>
          <p>
            You have full control over your data.
            <br />- Local data can be cleared by purging your browser's site data.
            <br />- You can delete your synced projects from the dashboard at any time.
            <br />- For complete account deletion or removal of publicly shared links, please contact us directly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at: <a href="mailto:satya@satyendra.in" className="text-blue-500 hover:underline">satya@satyendra.in</a>.
          </p>
        </section>
      </article>
    </div>
  )
}
