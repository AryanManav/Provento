"use client";

import { useState, useActionState } from "react";
import {
  BadgeCheck,
  Camera,
  FileText,
  Github,
  Globe,
  GraduationCap,
  ImagePlus,
  Linkedin,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { updateCandidateProfileAction } from "@/lib/actions/candidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/common/modal";
import { StatusBanner } from "@/components/common/status-banner";
import { Avatar } from "@/components/common/avatar";
import {
  ProfileImageRemove,
  ProfileImageUpload,
} from "@/components/candidate/profile-image-upload";
import type { CandidateProfileView } from "@/lib/types/domain";
import type { ActionResponse } from "@/lib/types/actions";
import { RoleBadge } from "@/components/profile/role-badge";

const LINK_FIELDS = [
  {
    name: "githubUrl",
    label: "GitHub profile URL",
    icon: Github,
    placeholder: "https://github.com/yourhandle",
  },
  {
    name: "linkedinUrl",
    label: "LinkedIn profile URL",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/yourhandle",
  },
  {
    name: "portfolioUrl",
    label: "Portfolio or website",
    icon: Globe,
    placeholder: "https://myportfolio.dev",
  },
  {
    name: "resumeUrl",
    label: "Resume URL",
    icon: FileText,
    placeholder: "https://drive.google.com/file/d/…/view",
  },
] as const;

export function ProfileIntroCard({
  user,
  profile,
  verifiedCount,
  verifiedGithub = null,
  readOnly = false,
}: {
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  profile: CandidateProfileView | null;
  /** Completed projects with a recorded evaluation — the only basis for "verified". */
  verifiedCount: number;
  /** GitHub username proven by a linked account, not the typed URL. */
  verifiedGithub?: string | null;
  /** A company reviewing an applicant: no editing or uploading. */
  readOnly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResponse | null, formData: FormData) => {
      const result = await updateCandidateProfileAction(prev, formData);
      if (result.success) setIsEditing(false);
      return result;
    },
    null
  );

  const links = [
    { href: profile?.githubUrl, label: "GitHub", icon: Github },
    { href: profile?.linkedinUrl, label: "LinkedIn", icon: Linkedin },
    { href: profile?.portfolioUrl, label: "Portfolio", icon: Globe },
    { href: profile?.resumeUrl, label: "Resume", icon: FileText },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      <div className="relative h-32 border-b border-line bg-brand-50 sm:h-44">
        {profile?.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="bg-dot-grid absolute inset-0 opacity-70" />
        )}

        {!readOnly && (
          <div className="absolute right-fib5 top-fib5 flex gap-fib3">
            <ProfileImageUpload
              kind="banner"
              userId={user.id}
              label="Change banner"
              onError={setMediaError}
              className="inline-flex items-center gap-fib3 rounded-lg bg-surface/90 px-fib5 py-fib3 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur transition-colors hover:bg-surface"
            >
              <ImagePlus className="h-4 w-4" />
              {profile?.bannerUrl ? "Change banner" : "Add banner"}
            </ProfileImageUpload>
            {profile?.bannerUrl && (
              <ProfileImageRemove
                kind="banner"
                label="Remove banner"
                onError={setMediaError}
                className="inline-flex items-center rounded-lg bg-surface/90 px-fib4 py-fib3 text-ink-500 shadow-sm backdrop-blur transition-colors hover:bg-surface hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
              </ProfileImageRemove>
            )}
          </div>
        )}
      </div>

      <div className="px-fib6 pb-fib7 sm:px-fib7">
        {/* relative z-10: the banner above is positioned, and would otherwise
            paint over the part of the avatar that overlaps it. */}
        <div className="relative z-10 -mt-12 flex flex-wrap items-end justify-between gap-fib5">
          <div className="relative">
            <Avatar
              name={user.fullName}
              src={user.avatarUrl}
              className="h-24 w-24 rounded-full border-4 border-surface text-2xl"
            />
            {!readOnly && (
              <ProfileImageUpload
                kind="avatar"
                userId={user.id}
                label={user.avatarUrl ? "Change profile photo" : "Add profile photo"}
                onError={setMediaError}
                className="absolute -bottom-fib3 -right-fib3 grid h-9 w-9 place-items-center rounded-full border-2 border-surface bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700"
              >
                <Camera className="h-4 w-4" />
              </ProfileImageUpload>
            )}
          </div>

          {!readOnly && (
            <div className="flex items-center gap-fib3">
              {user.avatarUrl && (
                <ProfileImageRemove
                  kind="avatar"
                  onError={setMediaError}
                  className="text-xs font-semibold text-ink-400 transition-colors hover:text-rose-700"
                >
                  Remove photo
                </ProfileImageRemove>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-fib3"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit profile
              </Button>
            </div>
          )}
        </div>

        {mediaError && (
          <StatusBanner tone="error" className="mt-fib5">
            {mediaError}
          </StatusBanner>
        )}

        <div className="mt-fib6 flex flex-wrap items-center gap-fib4">
          <h1 className="text-2xl font-semibold text-ink-900 sm:text-3xl">
            {user.fullName}
          </h1>
          <RoleBadge role="candidate" />
          {verifiedCount > 0 && (
            <span className="inline-flex items-center gap-fib2 rounded-md bg-emerald-50 px-fib5 py-fib2 text-xs font-semibold text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              {verifiedCount} verified project{verifiedCount === 1 ? "" : "s"}
            </span>
          )}
          {verifiedGithub && (
            <a
              href={`https://github.com/${verifiedGithub}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-fib2 rounded-md bg-inverse px-fib5 py-fib2 text-xs font-semibold text-inverse-fg hover:bg-inverse/85"
            >
              <Github className="h-3.5 w-3.5" />
              Verified @{verifiedGithub}
            </a>
          )}
        </div>

        {profile?.headline ? (
          <p className="mt-fib3 max-w-2xl text-ink-600">{profile.headline}</p>
        ) : readOnly ? null : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mt-fib4 flex items-center gap-fib3 rounded-lg border border-dashed border-ink-300 px-fib5 py-fib3 text-sm font-medium text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" />
            Add a headline — e.g. Junior Backend Engineer · Node.js, PostgreSQL
          </button>
        )}

        {(profile?.location || profile?.education) && (
          <div className="mt-fib5 flex flex-wrap gap-fib4">
            {profile.location && (
              <span className="inline-flex items-center gap-fib3 rounded-md bg-ink-100 px-fib5 py-fib2 text-xs font-medium text-ink-600">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.education && (
              <span className="inline-flex items-center gap-fib3 rounded-md bg-ink-100 px-fib5 py-fib2 text-xs font-medium text-ink-600">
                <GraduationCap className="h-3.5 w-3.5" />
                {profile.education}
                {profile.graduationYear ? ` · ${profile.graduationYear}` : ""}
              </span>
            )}
          </div>
        )}

        <div className="mt-fib6 flex flex-wrap items-center gap-fib4 border-t border-line pt-fib6">
          {links.length > 0 ? (
            links.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-fib3 rounded-lg border border-line px-fib5 py-fib3 text-sm font-medium text-ink-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            })
          ) : readOnly ? (
            <p className="text-sm text-ink-400">No links added.</p>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              + Add your GitHub, LinkedIn and portfolio links
            </button>
          )}
        </div>
      </div>

      {isEditing && !readOnly && (
        <Modal title="Edit profile" onClose={() => setIsEditing(false)} size="lg">
          <form action={formAction} className="space-y-fib6">
            {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}

            <FormField
              label="Headline"
              hint="Shown to hiring managers in applicant lists."
            >
              {(id) => (
                <Input
                  id={id}
                  name="headline"
                  defaultValue={profile?.headline || ""}
                  placeholder="Junior Backend Engineer · Node.js, PostgreSQL, Docker"
                />
              )}
            </FormField>

            <div className="grid gap-fib5 sm:grid-cols-2">
              <FormField label="Location">
                {(id) => (
                  <Input
                    id={id}
                    name="location"
                    defaultValue={profile?.location || ""}
                    placeholder="Bengaluru / Remote"
                  />
                )}
              </FormField>
              <FormField label="Graduation year">
                {(id) => (
                  <Input
                    id={id}
                    name="graduationYear"
                    type="number"
                    defaultValue={profile?.graduationYear || ""}
                    placeholder="2025"
                  />
                )}
              </FormField>
            </div>

            <FormField label="Education">
              {(id) => (
                <Input
                  id={id}
                  name="education"
                  defaultValue={profile?.education || ""}
                  placeholder="B.Tech Computer Science — NIT Karnataka"
                />
              )}
            </FormField>

            {LINK_FIELDS.map((field) => (
              <FormField key={field.name} label={field.label} icon={field.icon}>
                {(id) => (
                  <Input
                    id={id}
                    name={field.name}
                    type="url"
                    defaultValue={profile?.[field.name] || ""}
                    placeholder={field.placeholder}
                  />
                )}
              </FormField>
            ))}

            <FormField label="Bio">
              {(id) => (
                <Textarea
                  id={id}
                  name="bio"
                  rows={4}
                  defaultValue={profile?.bio || ""}
                  placeholder="What you enjoy building, and the problems you like solving."
                />
              )}
            </FormField>

            <div className="flex items-center justify-end gap-fib4 border-t border-line pt-fib6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
