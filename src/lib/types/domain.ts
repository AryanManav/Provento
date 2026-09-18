/**
 * Application-facing view models.
 *
 * `database.types.ts` mirrors the SQL schema; these types are what pages and
 * components consume. Supabase cannot infer the shape of nested selects here,
 * so `src/lib/data/*` maps raw rows into these once, at the boundary, instead
 * of letting untyped join results spread through the UI.
 */
import type {
  ApplicationStatus,
  ProjectMessageAuthorRole,
  ProjectOutcomeType,
  ProjectStatus,
  ProjectWorkMode,
  SubmissionStatus,
} from "@/lib/types/database.types";
import type { NotificationType, SkillLevel } from "@/lib/constants";
import type { ProjectAvailability } from "@/lib/projects";

export interface CandidateProfileView {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  education: string | null;
  graduationYear: number | null;
  resumeUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  bannerUrl: string | null;
  availability: string;
}

export interface CandidateSkillView {
  id: string;
  skillName: string;
  skillLevel: SkillLevel;
  yearsExperience: number;
}

export interface CandidateProjectView {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  repositoryUrl: string | null;
  liveUrl: string | null;
}

export interface ProjectSummaryView {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ProjectStatus;
  expectedHours: number;
  paymentAmount: number;
  currency: string;
  applicationDeadline: string;
  companyId: string;
  companyName: string | null;
  /** Applicant cap set by the company; null means no cap. */
  maxApplicants: number | null;
}

/** A project in Browse, with how many places are taken. */
export interface BrowseProjectView extends ProjectSummaryView {
  applicationCount: number;
  availability: ProjectAvailability;
}

export interface CompanyProjectView extends ProjectSummaryView {
  /** Applications the company has not acted on yet (status still "submitted"). */
  awaitingReview: number;
}

/** Who did a finished project and what the company decided. */
export interface CompanyProjectResult {
  candidateName: string | null;
  outcome: ProjectOutcomeType | null;
}

export interface ProjectDetailView extends BrowseProjectView {
  workMode: ProjectWorkMode;
  companyLocation: string | null;
  /** From the company profile, for the brief's "About" section. */
  company: {
    description: string | null;
    website: string | null;
    industry: string | null;
    size: string | null;
    logoUrl: string | null;
    verified: boolean;
  };
  problemStatement: string;
  context: string;
  requirements: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
  evaluationCriteria: string[];
  projectDeadline: string;
  skills: { name: string; required: boolean }[];
}

export interface ApplicationSummaryView {
  id: string;
  status: ApplicationStatus;
  /** The company's message with a Selected / Rejected decision. */
  decisionNote: string | null;
  coverMessage: string;
  createdAt: string;
  project: {
    id: string;
    slug: string;
    title: string;
    status: ProjectStatus;
    paymentAmount: number;
    currency: string;
    companyId: string;
    companyName: string | null;
  } | null;
}

export interface ApplicantView {
  id: string;
  status: ApplicationStatus;
  coverMessage: string;
  relevantExperience: string | null;
  candidateName: string;
  candidateHeadline: string | null;
  candidateEmail: string | null;
}

export interface VerifiedTrialView {
  id: string;
  projectId: string;
  projectTitle: string;
  companyName: string;
  completedAt: string;
  paymentAmount: number;
  currency: string;
  requirementsCompleted: boolean;
  technicalQuality: string;
  writtenFeedback: string;
  outcome: ProjectOutcomeType | null;
}

export interface CandidateDashboardStats {
  skillsCount: number;
  profileStrength: number;
}

export interface CompanyView {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  industry: string | null;
  companySize: string | null;
  location: string | null;
  logoUrl: string | null;
  verified: boolean;
}

export interface AttachmentView {
  id: string;
  fileName: string;
  sizeBytes: number;
  /** Short-lived signed URL; null if one could not be issued. */
  url: string | null;
}

export interface SubmissionView {
  id: string;
  repositoryUrl: string;
  deploymentUrl: string | null;
  submissionNotes: string;
  submittedAt: string;
  status: SubmissionStatus;
  /** The company's message with its decision, and when it decided. */
  reviewNote: string | null;
  reviewedAt: string | null;
  attachments: AttachmentView[];
}

export interface ProjectMessageView {
  id: string;
  authorRole: ProjectMessageAuthorRole;
  body: string;
  createdAt: string;
  /** Written by the person viewing the thread. */
  mine: boolean;
}

/** Observable facts derived from a clarification thread. */
export interface ThreadEvidence {
  messages: number;
  companyQuestions: number;
  candidateReplies: number;
  /** Median wait between a company message and the candidate's reply. */
  candidateMedianResponseMs: number | null;
}

export interface ApplicantProfileView {
  applicationId: string;
  projectId: string;
  status: ApplicationStatus;
  coverMessage: string;
  relevantExperience: string | null;
  appliedAt: string;
  account: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  profile: CandidateProfileView;
  skills: CandidateSkillView[];
  projects: CandidateProjectView[];
  verifiedTrials: VerifiedTrialView[];
  githubUsername: string | null;
}

/** A project the candidate was selected for — their side of the evaluation. */
export interface TrialView {
  projectId: string;
  companyId: string;
  title: string;
  slug: string;
  companyName: string | null;
  status: ProjectStatus;
  paymentAmount: number;
  currency: string;
  expectedHours: number;
  projectDeadline: string;
  selectedAt: string;
}

export interface TrialDetailView extends TrialView {
  workMode: ProjectWorkMode;
  problemStatement: string;
  context: string;
  requirements: string[];
  deliverables: string[];
  acceptanceCriteria: string[];
  evaluationCriteria: string[];
  submissions: SubmissionView[];
  canSubmit: boolean;
}

export interface FeedbackView {
  id: string;
  requirementsCompleted: boolean;
  technicalQuality: string;
  completeness: string;
  testingQuality: string;
  documentationQuality: string;
  deadlineMet: boolean;
  revisionsRequired: number;
  writtenFeedback: string;
  whatWasMissing: string | null;
  wouldInterviewOrHire: string;
  createdAt: string;
}

export interface OutcomeView {
  id: string;
  outcome: ProjectOutcomeType;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

/** Everything a company reviewer needs on the evaluation screen. */
export interface EvaluationView {
  projectId: string;
  title: string;
  companyId: string;
  status: ProjectStatus;
  evaluationCriteria: string[];
  acceptanceCriteria: string[];
  projectDeadline: string;
  candidate: {
    id: string;
    name: string;
    email: string | null;
    headline: string | null;
  } | null;
  submissions: SubmissionView[];
  feedback: FeedbackView | null;
  outcome: OutcomeView | null;
}

export interface NotificationView {
  id: string;
  /** Rows with a type this build doesn't know map to "other". */
  type: NotificationType | "other";
  title: string;
  message: string;
  /** Always an internal path; anything else is dropped when mapped. */
  linkUrl: string | null;
  projectId: string | null;
  read: boolean;
  createdAt: string;
}

/** Just enough about each unread row to badge nav items and highlight cards. */
export interface UnreadMarker {
  id: string;
  type: NotificationView["type"];
  projectId: string | null;
  linkUrl: string | null;
}

export interface NotificationSummary {
  unreadCount: number;
  recent: NotificationView[];
  unread: UnreadMarker[];
}

/** What a candidate sees about a company before deciding to work for it. */
export interface CompanyPublicView {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  logoUrl: string | null;
  verified: boolean;
  memberSince: string;
  trackRecord: {
    openProjects: number;
    completedEvaluations: number;
    hires: number;
    interviews: number;
    cancelledProjects: number;
  };
  openProjects: ProjectSummaryView[];
}

export interface AccountSettingsView {
  signInMethods: { provider: string; label: string }[];
  /** False for Google/GitHub-only accounts, which can still set one. */
  hasPassword: boolean;
  /** Reasons the account can't be deleted right now; empty when it can. */
  deletionBlockers: string[];
}
