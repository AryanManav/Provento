import { requireCandidate } from "@/lib/auth/guards";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { User, Code2, GraduationCap, Github, Linkedin, Globe } from "lucide-react";

export default async function CandidateProfilePage() {
  const user = await requireCandidate();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Candidate Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your profile provides the evidence hiring managers review before selecting you for a trial project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Details</CardTitle>
          <CardDescription>Name, email, and primary headline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Full Name</label>
              <Input value={user.fullName} readOnly className="bg-slate-50 cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">Email</label>
              <Input value={user.email} readOnly className="bg-slate-50 cursor-not-allowed" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase">Professional Headline</label>
            <Input
              placeholder="e.g. Aspiring Junior Backend Engineer | Node.js & PostgreSQL"
              defaultValue={profile?.headline || ""}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase">Bio</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief summary of what you build and what you are looking to learn..."
              defaultValue={profile?.bio || ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links & Portfolio</CardTitle>
          <CardDescription>Showcase your GitHub, personal website, and LinkedIn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
              <Github className="h-3.5 w-3.5" /> GitHub URL
            </label>
            <Input placeholder="https://github.com/username" defaultValue={profile?.github_url || ""} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn URL
            </label>
            <Input placeholder="https://linkedin.com/in/username" defaultValue={profile?.linkedin_url || ""} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Portfolio URL
            </label>
            <Input placeholder="https://myportfolio.dev" defaultValue={profile?.portfolio_url || ""} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-indigo-600 hover:bg-indigo-700">Save Profile</Button>
      </div>
    </div>
  );
}
