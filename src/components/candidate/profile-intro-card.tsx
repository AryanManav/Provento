"use client";

import { useState, useActionState } from "react";
import { updateCandidateProfileAction } from "@/app/(candidate)/candidate/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  GraduationCap,
  Github,
  Linkedin,
  Globe,
  FileText,
  Pencil,
  CheckCircle,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ProfileIntroCardProps {
  user: {
    fullName: string;
    email: string;
  };
  profile: {
    headline: string | null;
    bio: string | null;
    location: string | null;
    education: string | null;
    graduation_year: number | null;
    resume_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    linkedin_url: string | null;
    availability: string;
  } | null;
}

export function ProfileIntroCard({ user, profile }: ProfileIntroCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const res = await updateCandidateProfileAction(prev, formData);
    if (res.success) {
      setIsEditing(false);
    }
    return res;
  }, null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-sm overflow-hidden">
      {/* LinkedIn-style Cover Banner */}
      <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-[#004182] via-[#0a66c2] to-[#3880c8] relative">
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm transition-all"
            title="Edit intro"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Info Header */}
      <div className="px-6 pb-6 pt-0 relative">
        {/* Avatar Bubble */}
        <div className="-mt-16 sm:-mt-20 mb-4 flex items-end justify-between">
          <div className="relative">
            <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-white bg-slate-900 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-md ring-1 ring-black/5">
              {getInitials(user.fullName)}
            </div>
            <span
              className="absolute bottom-1 right-2 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white"
              title="Available for evaluation projects"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>
            {profile?.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="rounded-full gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Resume</span>
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Identity & Headline */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#191919]">{user.fullName}</h1>
            <Badge variant="secondary" className="bg-[#ebf4fd] text-[#0a66c2] border-none font-medium">
              Verified Candidate
            </Badge>
          </div>

          <p className="text-base text-slate-700 max-w-2xl">
            {profile?.headline || (
              <span className="text-slate-400 italic">
                Add a headline (e.g. Junior Backend Engineer | Node.js, PostgreSQL, Docker)
              </span>
            )}
          </p>

          {/* Location, Education & Links row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 pt-1">
            {profile?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {profile.location}
              </span>
            )}
            {profile?.education && (
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                {profile.education} {profile.graduation_year ? `(${profile.graduation_year})` : ""}
              </span>
            )}
            <span className="flex items-center gap-1 text-[#0a66c2] font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              Open to Paid Trial Projects
            </span>
          </div>

          {/* Social / Portfolio Links */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            {profile?.github_url ? (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0a66c2] transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            ) : null}

            {profile?.linkedin_url ? (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0a66c2] hover:underline"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            ) : null}

            {profile?.portfolio_url ? (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#0a66c2] transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span>Portfolio</span>
              </a>
            ) : null}

            {!profile?.github_url && !profile?.linkedin_url && !profile?.portfolio_url && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#0a66c2] font-semibold hover:underline"
              >
                + Add your GitHub and portfolio links
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Edit Introduction & Details</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {state?.error && (
                <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Headline
                </label>
                <Input
                  name="headline"
                  defaultValue={profile?.headline || ""}
                  placeholder="e.g. Junior Backend Engineer | Node.js, PostgreSQL, Docker"
                />
                <p className="text-[11px] text-slate-500">
                  Visible to hiring managers in search and evaluation lists.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Location
                  </label>
                  <Input
                    name="location"
                    defaultValue={profile?.location || ""}
                    placeholder="e.g. Bengaluru, India / Remote"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Graduation Year
                  </label>
                  <Input
                    name="graduationYear"
                    type="number"
                    defaultValue={profile?.graduation_year || ""}
                    placeholder="e.g. 2025"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Education / Degree
                </label>
                <Input
                  name="education"
                  defaultValue={profile?.education || ""}
                  placeholder="e.g. B.Tech Computer Science - NIT Karnataka"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" /> GitHub Profile URL
                </label>
                <Input
                  name="githubUrl"
                  defaultValue={profile?.github_url || ""}
                  placeholder="https://github.com/yourhandle"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn Profile URL
                </label>
                <Input
                  name="linkedinUrl"
                  defaultValue={profile?.linkedin_url || ""}
                  placeholder="https://linkedin.com/in/yourhandle"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Portfolio or Personal Website
                </label>
                <Input
                  name="portfolioUrl"
                  defaultValue={profile?.portfolio_url || ""}
                  placeholder="https://myportfolio.dev"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Resume URL (Google Drive / Hosted PDF)
                </label>
                <Input
                  name="resumeUrl"
                  defaultValue={profile?.resume_url || ""}
                  placeholder="https://drive.google.com/file/d/.../view"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase">
                  Bio / Summary
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={profile?.bio || ""}
                  placeholder="Briefly describe what you enjoy building, technical achievements, or problems you like solving..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a66c2]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="rounded-full">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
