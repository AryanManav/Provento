import type {
  ApplicationStatus,
  ProjectOutcomeType,
  ProjectStatus,
  UserRole,
} from "@/lib/types/database.types";

export const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  admin: "/admin",
  company: "/company/dashboard",
  candidate: "/candidate/dashboard",
};

export function dashboardFor(role: UserRole): string {
  return DASHBOARD_BY_ROLE[role] ?? DASHBOARD_BY_ROLE.candidate;
}

/**
 * users.role is the source of truth. user_metadata is writable by the user
 * (supabase.auth.updateUser), so when it is the only thing available it may
 * yield candidate or company — never admin.
 */
export function resolveUserRole(
  dbRole: UserRole | null | undefined,
  metadataRole: unknown
): UserRole {
  if (dbRole) return dbRole;
  return metadataRole === "company" ? "company" : "candidate";
}

export const PROFILE_BY_ROLE: Record<UserRole, string> = {
  admin: "/admin",
  company: "/company/profile",
  candidate: "/candidate/profile",
};

export function profileFor(role: UserRole): string {
  return PROFILE_BY_ROLE[role] ?? PROFILE_BY_ROLE.candidate;
}

/** Statuses in which a project still accepts candidate applications. */
export const OPEN_PROJECT_STATUSES = [
  "published",
  "applications_open",
] as const satisfies readonly ProjectStatus[];

/** Application statuses a company reviewer is allowed to set by hand. */
export const REVIEWABLE_APPLICATION_STATUSES = [
  "reviewing",
  "shortlisted",
  "selected",
  "rejected",
] as const satisfies readonly ApplicationStatus[];

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

/** Project statuses in which the selected candidate may submit or resubmit work. */
export const SUBMITTABLE_PROJECT_STATUSES = [
  "candidate_selected",
  "in_progress",
  "revision_requested",
] as const satisfies readonly ProjectStatus[];

/**
 * Deliberately descriptive rather than numeric.
 *
 * The product thesis is to capture observable evidence, not invented precision:
 * a 1–10 score implies a calibration nobody has yet. Revisit once enough
 * outcomes exist to show what actually predicts a hire.
 */
export const QUALITY_LEVELS = [
  "below_expectations",
  "meets_expectations",
  "exceeds_expectations",
] as const;

export type QualityLevel = (typeof QUALITY_LEVELS)[number];

/** What the reviewer would do next — the signal that matters commercially. */
export const HIRE_RECOMMENDATIONS = ["no", "talent_pool", "interview", "hire"] as const;

export type HireRecommendation = (typeof HIRE_RECOMMENDATIONS)[number];

/** Outcomes a company reviewer records by hand after an evaluation. */
export const RECORDABLE_OUTCOMES = [
  "no_hire",
  "interview",
  "hire",
  "talent_pool",
] as const satisfies readonly ProjectOutcomeType[];

export const CANDIDATE_ACTIVITY_TYPES = {
  profileUpdated: "profile_updated",
  skillAdded: "skill_added",
  portfolioUpdated: "portfolio_updated",
  applicationSubmitted: "application_submitted",
  workSubmitted: "project_submission",
  githubConnected: "github_connected",
} as const;

export type CandidateActivityType =
  (typeof CANDIDATE_ACTIVITY_TYPES)[keyof typeof CANDIDATE_ACTIVITY_TYPES];

export const DEFAULT_CURRENCY = "INR";

export interface NavLink {
  label: string;
  href: string;
}

const HOW_IT_WORKS: NavLink = { label: "How It Works", href: "/how-it-works" };
const BROWSE_PROJECTS: NavLink = { label: "Browse Projects", href: "/projects" };

/**
 * Top-level navigation, by who is signed in.
 *
 * The marketing links are for visitors only: "For Candidates" is noise to a
 * signed-in startup, and the public project board is the candidate's surface,
 * not the company's. Signed-in users get their own area instead, and everything
 * else lives in their role nav.
 */
export function primaryNavFor(role: UserRole | null | undefined): NavLink[] {
  switch (role) {
    case "candidate":
      return [BROWSE_PROJECTS, HOW_IT_WORKS];
    case "company":
      return [{ label: "My Projects", href: "/company/projects" }, HOW_IT_WORKS];
    case "admin":
      return [{ label: "Platform Overview", href: "/admin" }];
    default:
      return [
        BROWSE_PROJECTS,
        HOW_IT_WORKS,
        { label: "For Candidates", href: "/for-candidates" },
        { label: "For Startups", href: "/for-companies" },
      ];
  }
}

export const PROFILE_MEDIA_BUCKET = "profile-media";

/** Each kind is stored at a fixed path so a new upload replaces the old one. */
export const PROFILE_MEDIA = {
  avatar: { maxBytes: 2 * 1024 * 1024, label: "Profile photo" },
  banner: { maxBytes: 5 * 1024 * 1024, label: "Banner" },
  logo: { maxBytes: 2 * 1024 * 1024, label: "Company logo" },
} as const;

export type ProfileMediaKind = keyof typeof PROFILE_MEDIA;

export const PROFILE_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Social sign-in providers, by Supabase provider id. */
export const OAUTH_PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

/** Applications a candidate may still withdraw — never once selected. */
export const WITHDRAWABLE_APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "shortlisted",
] as const satisfies readonly ApplicationStatus[];

export const WORK_MODES = {
  local: {
    label: "Build locally",
    description: "The candidate works in their own tools and submits a repository.",
    available: true,
  },
  in_app: {
    label: "Build in Trialent",
    description: "The candidate builds inside Trialent's editor.",
    available: false,
  },
} as const;

export const SUBMISSION_FILES_BUCKET = "submission-files";

/**
 * Attachments sit beside the required repository. The allowlist leaves out
 * anything a browser would render or execute (html, svg, js).
 */
export const SUBMISSION_ATTACHMENTS = {
  maxFiles: 5,
  maxBytes: 25 * 1024 * 1024,
  extensions: ["pdf", "zip", "ipynb", "csv", "md", "txt", "png", "jpg", "jpeg"],
} as const;

/**
 * Kinds of in-app notification. Rows are written only by database triggers
 * (`20260921000000_notifications.sql`); these are the `type` values they use.
 */
export const NOTIFICATION_TYPES = [
  "application_received",
  "application_withdrawn",
  "application_status",
  "work_submitted",
  "submission_status",
  "message",
  "feedback",
  "outcome",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** How often an open tab re-checks for new notifications. */
export const NOTIFICATION_POLL_MS = 30_000;

/** Polled by open tabs for the current user's notification summary. */
export const NOTIFICATIONS_API_PATH = "/api/notifications";

/**
 * A trial is over once its project reaches one of these: it leaves Trial
 * Projects and shows as finished in My Applications.
 */
export const CLOSED_PROJECT_STATUSES = [
  "completed",
  "cancelled",
] as const satisfies readonly ProjectStatus[];

/** Headcount bands offered on the company profile. */
export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"] as const;

/** A company's public profile, where candidates check a startup before applying. */
export function companyProfilePath(companyId: string): string {
  return `/companies/${companyId}`;
}

/**
 * Short-lived cookie carrying the sign-up role and post-login destination
 * across an OAuth round trip. The redirect URL can't carry them reliably:
 * Supabase drops a redirect_to that isn't on its allow list (falling back to
 * the Site URL), and query strings rarely match the list exactly.
 */
export const OAUTH_INTENT_COOKIE = "trialent_oauth_intent";
export const OAUTH_INTENT_MAX_AGE_SECONDS = 600;

/** Where each role manages its account. Admins are managed by hand. */
export const SETTINGS_BY_ROLE: Record<UserRole, string | null> = {
  candidate: "/candidate/settings",
  company: "/company/settings",
  admin: null,
};

export function settingsFor(role: UserRole): string | null {
  return SETTINGS_BY_ROLE[role] ?? null;
}
