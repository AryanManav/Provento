import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provento - Try Talent Through Real Work Before You Hire",
  description:
    "A project-based talent discovery and evaluation platform for startups to evaluate emerging technical talent through standardized paid work before hiring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-slate-50 antialiased text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
