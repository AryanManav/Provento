import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    // Page-as-card: the site sits inset on a grey backdrop rather than filling
    // the window. overflow-clip rounds the corners without creating a scroll
    // container, which would break the sticky navbar.
    <div className="min-h-screen bg-ink-100 sm:p-fib4">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col overflow-clip bg-surface shadow-sm sm:min-h-[calc(100vh-1rem)] sm:rounded-2xl">
        <PublicNavbar />
        <main className="flex-1 min-h-[32rem]">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
