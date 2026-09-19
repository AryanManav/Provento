import Link from "next/link";
import { cn } from "@/lib/utils";

function Count({ value, label, href }: { value: number; label: string; href?: string }) {
  const body = (
    <>
      <span className="tabular font-semibold text-ink-900">
        {value.toLocaleString("en-IN")}
      </span>{" "}
      <span className="text-ink-500">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-sm hover:underline focus-visible:underline">
      {body}
    </Link>
  ) : (
    <span>{body}</span>
  );
}

/** "127 Followers" — links to the followers list when given one. */
export function FollowerCount({ count, href }: { count: number; href?: string }) {
  return (
    <Count value={count} label={count === 1 ? "Follower" : "Followers"} href={href} />
  );
}

/** "84 Following" — links to the following list when given one. */
export function FollowingCount({ count, href }: { count: number; href?: string }) {
  return <Count value={count} label="Following" href={href} />;
}

/**
 * The one-line social and activity summary under a profile's name. Every
 * item is a real number from the database; items without data are left out.
 */
export function ProfileStats({
  items,
  className,
}: {
  items: { value: number; label: string; href?: string }[];
  className?: string;
}) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm", className)}>
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          {index > 0 && (
            <span aria-hidden className="text-ink-300">
              ·
            </span>
          )}
          <Count value={item.value} label={item.label} href={item.href} />
        </span>
      ))}
    </p>
  );
}
