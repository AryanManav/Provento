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
  ExperienceLevel,
  JobType,
  OpportunityType,
  ProjectMessageAuthorRole,
  WorkArrangement,
  ProjectOutcomeType,
  ProjectPurpose,
  ProjectCategory,
  CompanyWorkStyle,
  SelectionWorkStatus,
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
  /** Recruiting ("hire", up to `openings` candidates) or just the work ("build", one). */
  purpose: ProjectPurpose;
  openings: number;
  /** The topic Browse lists it under. */
  category: ProjectCategory;
  /** The tech stack, required skills first. */
  stack: string[];
  /** Build only (a paid project, one candidate) or hire only (a free job posting). */
  opportunityType: OpportunityType;
  /** Hire only; null on build projects. */
  jobType: JobType | null;
  workArrangement: WorkArrangement | null;
  jobLocation: string | null;
  experienceLevel: ExperienceLevel | null;
  compensation: string | null;
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

/** Who did a finished project and what the company decided, per candidate. */
export interface CompanyProjectResult {
  candidates: { name: string; outcome: ProjectOutcomeType | null }[];
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
  /** Hire only. */
  responsibilities: string[];
  niceToHave: string[];
}

export interface ApplicationSummaryView {
  id: string;
  status: ApplicationStatus;
  /** The company's message with a Selected / Rejected decision. */
  decisionNote: string | null;
  /** This candidate's own work status once selected; null before that. */
  workStatus: SelectionWorkStatus | null;
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
    opportunityType: OpportunityType;
  } | null;
}

export interface ApplicantView {
  id: string;
  candidateId: string;
  status: ApplicationStatus;
  /** The candidate's work status once selected; null before that. */
  workStatus: SelectionWorkStatus | null;
  coverMessage: string;
  relevantExperience: string | null;
  candidateName: string;
  candidateHeadline: string | null;
  candidateEmail: string | null;
  candidateAvatarUrl: string | null;
  candidateSkills: string[];
  appliedAt: string;
}

/** One application in a company's hiring pipeline, across all its projects. */
export interface PipelineEntry {
  applicationId: string;
  applicationStatus: ApplicationStatus;
  workStatus: SelectionWorkStatus | null;
  projectId: string;
  projectTitle: string;
  projectDeadline: string;
  opportunityType: OpportunityType;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string | null;
  candidateAvatarUrl: string | null;
  appliedAt: string;
}

/**
 * A finished project whose delivered work the startup accepted — the evidence on
 * a candidate's profile. Written feedback and an outcome are added when the
 * startup recorded them; acceptance alone is enough to appear.
 */
export interface VerifiedTrialView {
  id: string;
  projectId: string;
  projectTitle: string;
  companyName: string;
  completedAt: string;
  paymentAmount: number;
  currency: string;
  /** The startup's message when it accepted the work. */
  acceptanceNote: string | null;
  feedback: {
    requirementsCompleted: boolean;
    technicalQuality: string;
    writtenFeedback: string;
  } | null;
  outcome: ProjectOutcomeType | null;
}

export interface ProfileChecklistItem {
  label: string;
  done: boolean;
  href: string;
}

export interface CandidateDashboardStats {
  skillsCount: number;
  profileStrength: number;
  /** What makes up the strength, in the order a candidate should fill it in. */
  checklist: ProfileChecklistItem[];
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
  /** Culture and stack — what working there is like. */
  techStack: string[];
  workStyle: CompanyWorkStyle | null;
  perks: string | null;
  hiringProcess: string | null;
  foundedYear: number | null;
  /** Links candidates can check. */
  linkedinUrl: string | null;
  githubUrl: string | null;
  careersUrl: string | null;
}

export interface CompanyTeamMember {
  userId: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
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
  /** This candidate's own work cycle on the project. */
  workStatus: SelectionWorkStatus;
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

/** A startup's evaluation, as the candidate it's about sees it. */
export interface CandidateEvaluationView {
  feedback: {
    requirementsCompleted: boolean;
    technicalQuality: string;
    completeness: string;
    testingQuality: string;
    documentationQuality: string;
    deadlineMet: boolean;
    revisionsRequired: number;
    writtenFeedback: string;
    whatWasMissing: string | null;
    recordedAt: string;
  } | null;
  outcome: ProjectOutcomeType | null;
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
  purpose: ProjectPurpose;
  /** This candidate's own work status on the project. */
  workStatus: SelectionWorkStatus;
  evaluationCriteria: string[];
  acceptanceCriteria: string[];
  projectDeadline: string;
  candidate: {
    id: string;
    name: string;
    email: string | null;
    headline: string | null;
  };
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
  techStack: string[];
  workStyle: CompanyWorkStyle | null;
  perks: string | null;
  hiringProcess: string | null;
  foundedYear: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  careersUrl: string | null;
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
    /** Null until the social-graph migration runs. */
    projectsPosted: number | null;
  };
  openProjects: BrowseProjectView[];
}

export interface AccountSettingsView {
  signInMethods: { provider: string; label: string }[];
  /** False for Google/GitHub-only accounts, which can still set one. */
  hasPassword: boolean;
  /** Reasons the account can't be deleted right now; empty when it can. */
  deletionBlockers: string[];
  /** Candidates only: shown in search with a public profile. Null for others. */
  discoverable: boolean | null;
  /** Candidates only: their public profile's address. */
  publicProfilePath: string | null;
}

/** A company in the candidate-facing directory. */
export interface CompanyDirectoryEntry {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  size: string | null;
  logoUrl: string | null;
  verified: boolean;
  workStyle: CompanyWorkStyle | null;
  openProjects: number;
}

/** One hit in the people-and-companies search. */
export interface SearchResult {
  kind: "company" | "candidate";
  id: string;
  title: string;
  /** Candidate headline, or company industry. */
  subtitle: string | null;
  imageUrl: string | null;
  location: string | null;
  /** Candidate skills, or company tech stack. */
  skills: string[];
  /** Candidates: work a startup accepted. */
  verifiedCount: number;
  /** Companies: projects taking applications now. */
  openProjects: number;
  companySize: string | null;
}

/** A piece of work a startup accepted, as shown on a public profile. */
export interface VerifiedWorkView {
  projectId: string;
  title: string;
  companyId: string;
  companyName: string;
  category: ProjectCategory;
  expectedHours: number;
  stack: string[];
  acceptedAt: string;
}

export interface FollowStats {
  followers: number;
  following: boolean;
}

/** What anyone signed in may see of a discoverable candidate. No contact details. */
export interface CandidatePublicView {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  education: string | null;
  graduationYear: number | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  isSelf: boolean;
  skills: { name: string; level: string | null }[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
    repositoryUrl: string | null;
    liveUrl: string | null;
  }[];
  verifiedProjects: number;
  verifiedWork: VerifiedWorkView[];
  /** Days with recorded progress (a day repeats per kind of progress). */
  activityDates: string[];
}

/** Who a profile belongs to, as the rest of the product labels it. */
export type ProfileRole = "candidate" | "company";

/** Follower and following counts for a profile, and whether the viewer follows it. */
export interface ProfileSocial {
  followers: number;
  /** What this profile follows; companies don't follow, so always 0 for them. */
  following: number;
  viewerFollows: boolean;
}

/** One row in a followers / following list. */
export interface ConnectionView {
  kind: ProfileRole;
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  viewerFollows: boolean;
  /** The row is the viewer themself (no follow button). */
  isViewer: boolean;
}
