import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkTabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";

export type MyWorkSection = "applications" | "active" | "completed";

/**
 * "My work" is one place with three views: what you applied to, what you're
 * building, and what you've delivered. Every view opens with this header so
 * the section never changes shape.
 */
export function MyWorkHeader({
  section,
  counts,
}: {
  section: MyWorkSection;
  counts?: Partial<Record<MyWorkSection, number>>;
}) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="My work"
        description="Your applications, the projects you're building, and the work you've delivered."
        actions={
          <Link href="/projects">
            <Button variant="outline">
              <Search className="h-4 w-4" aria-hidden />
              Find projects
            </Button>
          </Link>
        }
      />
      <LinkTabs
        label="My work"
        active={section}
        tabs={[
          {
            id: "applications",
            label: "Applications",
            href: "/candidate/applications",
            count: counts?.applications,
          },
          {
            id: "active",
            label: "Active",
            href: "/candidate/trials",
            count: counts?.active,
          },
          {
            id: "completed",
            label: "Completed",
            href: "/candidate/completed",
            count: counts?.completed,
          },
        ]}
      />
    </div>
  );
}
