import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProfileAboutCard({ bio }: { bio: string | null }) {
  return (
    <Card className="rounded-xl border border-[#e0dfdc] bg-white shadow-sm p-6 space-y-3">
      <h2 className="text-lg font-bold text-[#191919]">About</h2>
      {bio ? (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{bio}</p>
      ) : (
        <p className="text-sm text-slate-400 italic">
          No bio added yet. Write a brief overview of your technical background and what you are looking to build.
        </p>
      )}
    </Card>
  );
}
