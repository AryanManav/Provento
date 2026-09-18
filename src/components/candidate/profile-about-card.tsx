import { UserRound } from "lucide-react";
import { SectionCard } from "@/components/common/section-card";

export function ProfileAboutCard({
  bio,
  readOnly = false,
}: {
  bio: string | null;
  readOnly?: boolean;
}) {
  return (
    <SectionCard title="About" icon={UserRound}>
      {bio ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{bio}</p>
      ) : (
        <p className="text-sm text-ink-400">
          {readOnly
            ? "No bio added."
            : "No bio yet. Use Edit profile to describe your technical background and what you want to build."}
        </p>
      )}
    </SectionCard>
  );
}
