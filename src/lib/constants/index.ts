import type {
  CompanyWorkStyle,
  ProjectCategory,
  SelectionWorkStatus,
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
/**
 * Statuses Browse lists (until the application deadline): open ones, and ones
 * where a candidate was picked and the work is under way.
 */
export const BROWSABLE_PROJECT_STATUSES = [
  "published",
  "applications_open",
  "candidate_selected",
  "in_progress",
  "submitted",
  "under_review",
  "revision_requested",
] as const satisfies readonly ProjectStatus[];

/** Most applicants a company may allow on one project. */
export const MAX_APPLICANTS_LIMIT = 500;

export const OPEN_PROJECT_STATUSES = [
  "published",
  "applications_open",
] as const satisfies readonly ProjectStatus[];

/** Application statuses a company reviewer is allowed to set by hand. */
export const REVIEWABLE_APPLICATION_STATUSES = [
  "reviewing",
  "selected",
  "rejected",
] as const satisfies readonly ApplicationStatus[];

/** Labels for the company's status dropdown. */
export const REVIEWABLE_STATUS_LABELS: Record<
  (typeof REVIEWABLE_APPLICATION_STATUSES)[number],
  string
> = {
  reviewing: "Reviewing",
  selected: "Selected",
  rejected: "Rejected",
};

/**
 * Applications a company has closed — kept, but moved out of the main list.
 * ("shortlisted" is no longer offered; older applications may still carry it.)
 */
export const CLOSED_APPLICATION_STATUSES = [
  "rejected",
  "withdrawn",
] as const satisfies readonly ApplicationStatus[];

export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

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
  /** A selected candidate posting on the project thread. */
  workUpdate: "project_milestone",
  githubConnected: "github_connected",
} as const;

export type CandidateActivityType =
  (typeof CANDIDATE_ACTIVITY_TYPES)[keyof typeof CANDIDATE_ACTIVITY_TYPES];

export const DEFAULT_CURRENCY = "INR";

export interface NavLink {
  label: string;
  href: string;
}

const HOW_IT_WORKS: NavLink = { label: "How it works", href: "/how-it-works" };
const BROWSE_PROJECTS: NavLink = { label: "Browse projects", href: "/projects" };

/**
 * Top-level navigation, by who is signed in. It holds what's *outside* your
 * workspace — the workspace's own pages (dashboard, applications, projects,
 * profile, settings) live in the sidebar, so nothing appears twice.
 */
export function primaryNavFor(role: UserRole | null | undefined): NavLink[] {
  switch (role) {
    case "candidate":
      return [BROWSE_PROJECTS, { label: "Companies", href: "/companies" }];
    case "company":
    case "admin":
      // Everything a startup or admin opens is in its sidebar; the navbar
      // carries the startup's main action instead (see navbarActionFor).
      return [];
    default:
      return [
        BROWSE_PROJECTS,
        HOW_IT_WORKS,
        { label: "For candidates", href: "/for-candidates" },
        { label: "For startups", href: "/for-companies" },
      ];
  }
}

/** The one call to action a role gets in the navbar, if any. */
export function navbarActionFor(role: UserRole | null | undefined): NavLink | null {
  return role === "company"
    ? { label: "Post a project", href: "/company/projects/create" }
    : null;
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
  "new_project",
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

/**
 * Before a candidate is selected, the company may hide, re-publish or withdraw
 * its project (enforced by guard_project_status). After that, it can't.
 */
export const COMPANY_MANAGEABLE_PROJECT_STATUSES = [
  "draft",
  "published",
  "applications_open",
] as const satisfies readonly ProjectStatus[];

/** Most candidates a hiring project can select. */
export const MAX_OPENINGS = 10;

export const PROJECT_PURPOSES = {
  hire: {
    label: "Hire",
    description:
      "You're recruiting. Select up to your number of openings; the project keeps taking applications until they're filled.",
  },
  build: {
    label: "Build only",
    description:
      "You want the work done, not a hire. One candidate builds it; applications close when you select them.",
  },
} as const;

/** A selected candidate's work is finished once it reaches one of these. */
export const CLOSED_WORK_STATUSES = [
  "completed",
  "cancelled",
] as const satisfies readonly SelectionWorkStatus[];

/** A selected candidate can (re)submit in these states. */
export const SUBMITTABLE_WORK_STATUSES = [
  "in_progress",
  "revision_requested",
] as const satisfies readonly SelectionWorkStatus[];

/** Browse sections, in display order. */
export const PROJECT_CATEGORIES = {
  full_stack: {
    label: "Full-stack apps",
    blurb: "End-to-end products: UI, API and database.",
  },
  frontend: {
    label: "Frontend and web UI",
    blurb: "Interfaces, components and web experiences.",
  },
  backend: {
    label: "Backend and APIs",
    blurb: "Services, APIs, integrations and data models.",
  },
  mobile: { label: "Mobile apps", blurb: "Android, iOS and cross-platform apps." },
  ai_ml: {
    label: "AI and machine learning",
    blurb: "Models, LLM features and intelligent tools.",
  },
  data: { label: "Data and analytics", blurb: "Pipelines, dashboards and analysis." },
  devops: { label: "DevOps and cloud", blurb: "Infrastructure, CI/CD and reliability." },
  design: { label: "UI/UX design", blurb: "Research, flows and visual design." },
  other: { label: "Other projects", blurb: "Everything else startups need built." },
} as const satisfies Record<ProjectCategory, { label: string; blurb: string }>;

export const COMPANY_WORK_STYLES = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
} as const satisfies Record<CompanyWorkStyle, string>;

/**
 * What a company must fill in before it can post (mirrors the database's
 * company_ready_to_post): enough for a candidate to judge who they'd work for.
 */
export const COMPANY_SETUP_MIN_DESCRIPTION = 80;

/**
 * Where each signed-in role lands from "/" and the logo: their own dashboard.
 * Visitors get the landing page.
 */
export function homeFor(role: UserRole | null | undefined): string {
  return role ? dashboardFor(role) : "/";
}
