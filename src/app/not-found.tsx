import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <Link href="/" aria-label="Trialent home">
        <Logo />
      </Link>
      <span className="mt-10 grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface text-ink-400">
        <SearchX className="h-5 w-5" aria-hidden />
      </span>
      <h1 className="mt-3 text-xl font-semibold text-ink-900">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        The link may be old, or the project may no longer be listed.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/projects">
          <Button>Browse projects</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </main>
  );
}
