import Link from "next/link";
import { ChevronLeft, Search, Users } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { EmptyState } from "@/components/common/empty-state";
import { FollowButton } from "@/components/common/follow-button";
import { LinkTabs } from "@/components/ui/tabs";
import { RoleBadge } from "@/components/profile/role-badge";
import { companyProfilePath } from "@/lib/constants";
import type { ConnectionView, ProfileRole } from "@/lib/types/domain";

/**
 * A followers or following list: compact rows, each with who they are, which
 * side of the marketplace they're on, and a follow button. Profiles hidden
 * from search are counted but not listed.
 */
export function ConnectionList({
  owner,
  direction,
  connections,
  total,
  query,
}: {
  owner: {
    name: string;
    role: ProfileRole;
    href: string;
    followersHref: string;
    followingHref?: string;
  };
  direction: "followers" | "following";
  connections: ConnectionView[];
  /** Everyone in the list, including hidden profiles. */
  total: number;
  query: string;
}) {
  const term = query.trim().toLowerCase();
  const shown = term
    ? connections.filter((connection) =>
        `${connection.title} ${connection.subtitle ?? ""}`.toLowerCase().includes(term)
      )
    : connections;
  const hidden = Math.max(0, total - connections.length);
  const base = direction === "followers" ? owner.followersHref : owner.followingHref;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={owner.href}
        className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {owner.name}
      </Link>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink-900">
            {direction === "followers" ? "Followers" : "Following"}
          </h1>
          <RoleBadge role={owner.role} size="sm" />
        </div>
        <p className="text-sm text-ink-500">
          {direction === "followers"
            ? `${total.toLocaleString("en-IN")} ${total === 1 ? "person follows" : "people and companies follow"} ${owner.name}.`
            : `${owner.name} follows ${total.toLocaleString("en-IN")} ${total === 1 ? "profile" : "profiles"}.`}
        </p>
        {owner.followingHref && (
          <LinkTabs
            label="Connections"
            active={direction}
            tabs={[
              { id: "followers", label: "Followers", href: owner.followersHref },
              { id: "following", label: "Following", href: owner.followingHref },
            ]}
          />
        )}
      </div>

      {connections.length > 0 && (
        <form action={base} role="search">
          <label className="relative block">
            <span className="sr-only">
              Search {direction === "followers" ? "followers" : "following"}
            </span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={`Search ${direction === "followers" ? "followers" : "following"}`}
              className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </form>
      )}

      {shown.length === 0 ? (
        <EmptyState
          compact
          icon={Users}
          title={
            term
              ? `No one matches “${query}”`
              : direction === "followers"
                ? "No followers yet"
                : "Not following anyone yet"
          }
          description={
            term
              ? "Try a different name."
              : direction === "followers"
                ? `When people follow ${owner.name}, they appear here.`
                : "Companies and candidates followed from their profiles appear here."
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {shown.map((connection) => {
            const href =
              connection.kind === "company"
                ? companyProfilePath(connection.id)
                : `/candidates/${connection.id}`;
            return (
              <li
                key={`${connection.kind}-${connection.id}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar
                  name={connection.title}
                  src={connection.imageUrl}
                  className={
                    connection.kind === "company"
                      ? "h-10 w-10 rounded-lg text-xs"
                      : "h-10 w-10 rounded-full text-xs"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={href}
                      className="truncate text-sm font-medium text-ink-900 hover:text-brand-700 hover:underline"
                    >
                      {connection.title}
                    </Link>
                    <RoleBadge role={connection.kind} size="sm" />
                  </div>
                  {connection.subtitle && (
                    <p className="truncate text-xs text-ink-500">{connection.subtitle}</p>
                  )}
                </div>
                {connection.isViewer ? (
                  <span className="text-xs text-ink-400">You</span>
                ) : (
                  <FollowButton
                    size="sm"
                    name={connection.title}
                    following={connection.viewerFollows}
                    target={
                      connection.kind === "company"
                        ? { companyId: connection.id }
                        : { candidateId: connection.id }
                    }
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hidden > 0 && !term && (
        <p className="text-xs text-ink-500">
          {hidden} more {hidden === 1 ? "profile is" : "profiles are"} private and not
          listed.
        </p>
      )}
    </div>
  );
}
