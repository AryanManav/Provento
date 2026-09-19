"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Clock,
  FolderKanban,
  Loader2,
  Search,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { quickSearchAction, type QuickSearchResponse } from "@/lib/actions/search";
import { Avatar } from "@/components/common/avatar";
import { cn } from "@/lib/utils";
import {
  SEARCH_SUGGESTIONS,
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  searchHref,
} from "@/components/search/search-history";
import type { UserRole } from "@/lib/types/database.types";
import { RoleBadge } from "@/components/profile/role-badge";

const KIND_ICON = { project: FolderKanban, candidate: UserRound, company: Building2 };

interface Option {
  key: string;
  href: string;
  /** Recorded as a recent search when chosen. */
  query?: string;
}

/**
 * The navbar search. Focus opens a panel: recent and suggested searches when
 * empty, live results grouped by projects, candidates and companies as you
 * type. Enter opens the full results page. "/" or Ctrl/⌘ K focuses it from
 * anywhere.
 */
export function GlobalSearch({ role }: { role: UserRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<QuickSearchResponse | null>(null);
  const [active, setActive] = useState(-1);
  const [pending, startTransition] = useTransition();

  const trimmed = query.trim();
  const suggestions = SEARCH_SUGGESTIONS[role];

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
    inputRef.current?.blur();
  }, [pathname]);

  // "/" and Ctrl/⌘ K focus the search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Live results, debounced; stale responses are ignored.
  useEffect(() => {
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const response = await quickSearchAction(trimmed);
        setResults((current) =>
          response.query === inputRef.current?.value.trim() ? response : current
        );
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => setActive(-1), [trimmed, open]);

  const go = useCallback(
    (href: string, recordQuery?: string) => {
      if (recordQuery) setRecent(addRecentSearch(recordQuery));
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  // Every choosable row, in display order, for arrow-key navigation.
  const options: Option[] = useMemo(() => {
    if (trimmed.length < 2) {
      return [...recent, ...suggestions.filter((term) => !recent.includes(term))].map(
        (term) => ({ key: `term-${term}`, href: searchHref(term), query: term })
      );
    }
    const items = (results?.groups ?? []).flatMap((group) =>
      group.items.map((item) => ({ key: `${item.kind}-${item.id}`, href: item.href }))
    );
    return [...items, { key: "all", href: searchHref(trimmed), query: trimmed }];
  }, [trimmed, recent, suggestions, results]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(-1, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = options[active];
      if (chosen) go(chosen.href, chosen.query);
      else if (trimmed) go(searchHref(trimmed), trimmed);
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const optionProps = (key: string) => {
    const index = options.findIndex((option) => option.key === key);
    return {
      id: `${listId}-${index}`,
      role: "option" as const,
      "aria-selected": index === active,
      onMouseEnter: () => setActive(index),
      className: cn(
        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        index === active ? "bg-ink-100" : "hover:bg-ink-50"
      ),
    };
  };

  const recentTerms = recent;
  const suggestedTerms = suggestions.filter((term) => !recent.includes(term));

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg border px-2.5 transition-colors",
          open
            ? "border-brand-400 bg-white ring-2 ring-brand-100"
            : "border-line bg-ink-50 hover:border-ink-300"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-400" aria-hidden />
        ) : (
          <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setRecent(readRecentSearches());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={
            role === "company"
              ? "Search candidates, skills, projects"
              : "Search projects, companies, skills"
          }
          role="combobox"
          aria-label="Search Trialent"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="rounded p-0.5 text-ink-400 hover:text-ink-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-line bg-white px-1.5 font-mono text-2xs text-ink-400 lg:inline">
            /
          </kbd>
        )}
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search suggestions and results"
          className="absolute left-0 top-full z-50 mt-2 w-[min(36rem,calc(100vw-2rem))] animate-fade-in overflow-hidden rounded-xl border border-line bg-white shadow-lg"
        >
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {trimmed.length < 2 ? (
              <>
                {recentTerms.length > 0 && (
                  <div className="mb-1">
                    <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5">
                      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">
                        Recent
                      </p>
                      <button
                        type="button"
                        onClick={() => setRecent(clearRecentSearches())}
                        className="text-xs text-ink-500 hover:text-ink-900"
                      >
                        Clear
                      </button>
                    </div>
                    {recentTerms.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => go(searchHref(term), term)}
                        {...optionProps(`term-${term}`)}
                      >
                        <Clock className="h-4 w-4 text-ink-400" aria-hidden />
                        <span className="truncate text-ink-800">{term}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="px-2.5 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
                  {role === "company" ? "Find candidates skilled in" : "Popular searches"}
                </p>
                {suggestedTerms.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => go(searchHref(term), term)}
                    {...optionProps(`term-${term}`)}
                  >
                    <TrendingUp className="h-4 w-4 text-ink-400" aria-hidden />
                    <span className="truncate text-ink-800">{term}</span>
                  </button>
                ))}
              </>
            ) : results && results.groups.length === 0 && !pending ? (
              <p className="px-2.5 py-6 text-center text-sm text-ink-500">
                Nothing matches &ldquo;{trimmed}&rdquo;. Try a skill like
                &ldquo;React&rdquo;, a company, or a role.
              </p>
            ) : (
              (results?.groups ?? []).map((group) => (
                <div key={group.kind} className="mb-1">
                  <p className="flex items-center justify-between px-2.5 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">
                    {group.label}
                    <span className="tabular font-normal normal-case tracking-normal text-ink-400">
                      {group.total}
                    </span>
                  </p>
                  {group.items.map((item) => {
                    const Icon = KIND_ICON[item.kind];
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        {...optionProps(`${item.kind}-${item.id}`)}
                      >
                        {item.kind === "project" ? (
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-ink-50 text-ink-500">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                        ) : (
                          <Avatar
                            name={item.title}
                            src={item.imageUrl}
                            className={cn(
                              "h-8 w-8 shrink-0 text-2xs",
                              item.kind === "company" ? "rounded-md" : "rounded-full"
                            )}
                          />
                        )}
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium text-ink-900">
                            <span className="truncate">{item.title}</span>
                            {item.kind !== "project" && (
                              <RoleBadge role={item.kind} size="sm" />
                            )}
                          </span>
                          <span className="block truncate text-xs text-ink-500">
                            {item.meta}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {trimmed.length >= 2 && (
            <button
              type="button"
              onClick={() => go(searchHref(trimmed), trimmed)}
              {...optionProps("all")}
              className={cn(
                optionProps("all").className,
                "rounded-none border-t border-line px-4 py-2.5 font-medium text-brand-700"
              )}
            >
              <Search className="h-4 w-4" aria-hidden />
              See all results for &ldquo;{trimmed}&rdquo;
              <ArrowRight className="ml-auto h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
