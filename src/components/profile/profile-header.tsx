import type { ReactNode } from "react";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { cn } from "@/lib/utils";

export interface ProfileLink {
  label: string;
  href: string;
}

/**
 * The top of an identity page — a person or a company: picture, name, one
 * line of who they are, facts, links, and the page's actions. Used by both
 * profile types so identities read the same way across the product.
 */
export function ProfileHeader({
  name,
  imageUrl,
  bannerUrl,
  shape = "round",
  headline,
  badges,
  facts,
  links,
  stats,
  actions,
}: {
  name: string;
  imageUrl: string | null;
  bannerUrl?: string | null;
  /** People are round, companies are square. */
  shape?: "round" | "square";
  headline?: string | null;
  badges?: ReactNode;
  facts?: { icon: LucideIcon; text: string }[];
  links?: ProfileLink[];
  stats?: { label: string; value: number | string }[];
  actions?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="" className="h-28 w-full object-cover sm:h-36" />
      ) : (
        <div
          aria-hidden
          className="h-20 border-b border-line bg-ink-50 bg-line-grid [background-size:24px_24px] sm:h-24"
        />
      )}
      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Avatar
            name={name}
            src={imageUrl}
            className={cn(
              "h-20 w-20 text-xl ring-4 ring-white",
              shape === "round" ? "rounded-full" : "rounded-xl"
            )}
          />
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-ink-900">{name}</h1>
            {badges}
          </div>
          {headline && <p className="max-w-2xl text-base text-ink-700">{headline}</p>}
          {facts && facts.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
              {facts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <li key={fact.text} className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-ink-400" aria-hidden />
                    {fact.text}
                  </li>
                );
              })}
            </ul>
          )}
          {links && links.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {stats && stats.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5">
                <dd className="tabular text-sm font-semibold text-ink-900">
                  {stat.value}
                </dd>
                <dt className="text-sm text-ink-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
