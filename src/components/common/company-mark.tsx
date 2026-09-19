import { cn } from "@/lib/utils";

/** A square monogram for a company, so lists scan by who the work is with. */
export function CompanyMark({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const base = cn(
    "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-ink-50 text-xs font-semibold text-ink-600",
    className
  );
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className={cn(base, "object-cover")} />
    );
  }
  return (
    <span aria-hidden className={base}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
