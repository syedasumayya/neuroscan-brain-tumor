import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/public-sans";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "NeuroScan - brain MRI tumor screening",
  description: "Research tool for brain tumor screening from MRI. Not a medical device.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Sets the theme before React hydrates, so the page never flashes the wrong one. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('neuroscan:theme');" +
              "if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))" +
              "document.documentElement.dataset.theme='dark';}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}