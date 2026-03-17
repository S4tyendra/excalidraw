import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {  createBrowserRouter, RouterProvider, createHashRouter  } from 'react-router-dom';
import HomePage from "./page";
import SharePage from "./share/[slug]/page";
import ExportImport from "./export-import/page";
import Features from "./features/page";
import Privacy from "./privacy/page";
import Terms from "./terms/page";
import Contact from "./contact/page";
import Callback from "./callback/page";
import SharedLinks from "./shared-links/page";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ClientProviders } from "@/components/client-providers";

import "./globals.css";

// Use hash router to match user's previous preference and avoid Cloudflare Pages single-page redirection issues without explicit rules
const router = createHashRouter([
  { path: "/", element: <HomePage /> },
  { path: "/:slug", element: <HomePage /> }, 
  { path: "/share/:slug", element: <SharePage /> },
  { path: "/export-import", element: <ExportImport /> },
  { path: "/features", element: <Features /> },
  { path: "/privacy", element: <Privacy /> },
  { path: "/terms", element: <Terms /> },
  { path: "/contact", element: <Contact /> },
  { path: "/callback", element: <Callback /> },
  { path: "/shared-links", element: <SharedLinks /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClientProviders>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </ClientProviders>
  </StrictMode>
);
