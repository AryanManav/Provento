import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, MapPin, Search, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/guards";
import { MIN_SEARCH_LENGTH, getFollowing, searchDirectory } from "@/lib/data/directory";
import { companyProfilePath } from "@/lib/constants";
import { Avatar } from "@/components/common/avatar";
import type { SearchResult } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

function hrefFor(result: SearchResult): string {
  return result.kind === "company"
    ? companyProfilePath(result.id)
    : `/candidates/${result.id}`;
}

function ResultList({ title, items }: { title: string; items: SearchResult[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-fib3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
        {title} · {items.length}
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        {items.map((result) => (
          <li key={`${result.kind}-${result.id}`}>
            <Link
              href={hrefFor(result)}
              className="flex items-center gap-fib4 px-fib5 py-fib4 transition-colors hover:bg-ink-50"
            >
              <Avatar
                name={result.title}
                src={result.imageUrl}
                className={
                  result.kind === "company"
                    ? "h-11 w-11 rounded-xl text-sm"
                    : "h-11 w-11 rounded-full text-sm"
                }
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900">{result.title}</p>
                <p className="truncate text-xs text-ink-500">
                  {result.subtitle ??
                    (result.kind === "company" ? "Startup" : "Candidate")}
                </p>
              </div>
              {result.location && (
                <span className="hidden shrink-0 items-center gap-fib1 text-xs text-ink-400 sm:inline-flex">
                  <MapPin className="h-3.5 w-3.5" />
                  {result.location}
                </span>
              )}
              <span className="shrink-0 rounded-full bg-ink-100 px-fib3 py-0.5 text-[11px] font-semibold text-ink-600">
                {result.kind === "company" ? "Company" : "Candidate"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Find companies and candidates, whatever your own role. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/search");

  const { q = "" } = await searchParams;
  const query = q.trim();
  const searching = query.length >= MIN_SEARCH_LENGTH;
  const [results, following] = await Promise.all([
    searching ? searchDirectory(query) : Promise.resolve([]),
    searching ? Promise.resolve([]) : getFollowing(user.id),
  ]);
  const companies = results.filter((result) => result.kind === "company");
  const people = results.filter((result) => result.kind === "candidate");

  return (
    <div className="mx-auto max-w-3xl space-y-fib6 px-fib5 py-fib7 sm:px-fib6">
      <form action="/search" className="relative">
        <Search className="pointer-events-none absolute left-fib5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Search companies and candidates by name, skill or industry"
          aria-label="Search companies and candidates"
          className="h-14 w-full rounded-2xl border border-line bg-white pl-14 pr-fib5 text-base shadow-xs outline-none transition-shadow focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
      </form>

      {searching ? (
        results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-fib7 text-center text-sm text-ink-500">
            Nothing matches &ldquo;{query}&rdquo;. Try a name, a skill like
            &ldquo;React&rdquo;, or an industry.
          </p>
        ) : (
          <>
            <ResultList title="Companies" items={companies} />
            <ResultList title="Candidates" items={people} />
          </>
        )
      ) : following.length > 0 ? (
        <ResultList title="You follow" items={following} />
      ) : (
        <div className="space-y-fib3 rounded-2xl border border-dashed border-line p-fib7 text-center">
          <div className="flex justify-center gap-fib4 text-ink-300">
            <Building2 className="h-6 w-6" />
            <UserRound className="h-6 w-6" />
          </div>
          <p className="text-sm text-ink-600">
            Search for a startup or a candidate, then follow them.
          </p>
          <p className="text-xs text-ink-400">
            Follow a company and you&apos;ll be notified the moment it posts a new
            project.
          </p>
        </div>
      )}
    </div>
  );
}
