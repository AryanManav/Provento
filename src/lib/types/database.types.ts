export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "candidate" | "company" | "admin";

export type ProjectStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "applications_open"
  | "candidate_selected"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "completed"
  | "cancelled";

export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "shortlisted"
  | "selected"
  | "rejected"
  | "withdrawn";

export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "accepted"
  | "rejected";

export type ProjectOutcomeType =
  | "no_hire"
  | "interview"
  | "hire"
  | "talent_pool"
  | "candidate_withdrew"
  | "project_cancelled";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "processing"
  | "completed"
  | "refunded"
  | "failed"
  | "disputed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          avatar_url: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          avatar_url?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          avatar_url?: string | null;
          email_verified?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidate_profiles: {
        Row: {
          id: string;
          user_id: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          headline?: string | null;
          bio?: string | null;
          location?: string | null;
          education?: string | null;
          graduation_year?: number | null;
          resume_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          availability?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          headline?: string | null;
          bio?: string | null;
          location?: string | null;
          education?: string | null;
          graduation_year?: number | null;
          resume_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          availability?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      candidate_skills: {
        Row: {
          id: string;
          candidate_id: string;
          skill_name: string;
          skill_level: string;
          years_experience: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          skill_name: string;
          skill_level?: string;
          years_experience?: number;
          created_at?: string;
        };
        Update: {
          skill_name?: string;
          skill_level?: string;
          years_experience?: number;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      candidate_projects: {
        Row: {
          id: string;
          candidate_id: string;
          title: string;
          description: string;
          technologies: string[];
          repository_url: string | null;
          live_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          title: string;
          description: string;
          technologies?: string[];
          repository_url?: string | null;
          live_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          technologies?: string[];
          repository_url?: string | null;
          live_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_projects_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidate_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          description: string | null;
          industry: string | null;
          company_size: string | null;
          location: string | null;
          logo_url: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          description?: string | null;
          industry?: string | null;
          company_size?: string | null;
          location?: string | null;
          logo_url?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          website?: string | null;
          description?: string | null;
          industry?: string | null;
          company_size?: string | null;
          location?: string | null;
          logo_url?: string | null;
          verified?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          role?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          slug: string;
          description: string;
          problem_statement: string;
          context: string;
          requirements: string[];
          deliverables: string[];
          acceptance_criteria: string[];
          evaluation_criteria: string[];
          expected_hours: number;
          payment_amount: number;
          currency: string;
          application_deadline: string;
          project_deadline: string;
          status: ProjectStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          slug: string;
          description: string;
          problem_statement: string;
          context: string;
          requirements?: string[];
          deliverables?: string[];
          acceptance_criteria?: string[];
          evaluation_criteria?: string[];
          expected_hours?: number;
          payment_amount: number;
          currency?: string;
          application_deadline: string;
          project_deadline: string;
          status?: ProjectStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          problem_statement?: string;
          context?: string;
          requirements?: string[];
          deliverables?: string[];
          acceptance_criteria?: string[];
          evaluation_criteria?: string[];
          expected_hours?: number;
          payment_amount?: number;
          currency?: string;
          application_deadline?: string;
          project_deadline?: string;
          status?: ProjectStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_skills: {
        Row: {
          id: string;
          project_id: string;
          skill_name: string;
          is_required: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          skill_name: string;
          is_required?: boolean;
          created_at?: string;
        };
        Update: {
          skill_name?: string;
          is_required?: boolean;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          project_id: string;
          candidate_id: string;
          cover_message: string;
          relevant_experience: string | null;
          status: ApplicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          candidate_id: string;
          cover_message: string;
          relevant_experience?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cover_message?: string;
          relevant_experience?: string | null;
          status?: ApplicationStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_selections: {
        Row: {
          id: string;
          project_id: string;
          candidate_id: string;
          selected_by: string;
          selected_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          candidate_id: string;
          selected_by: string;
          selected_at?: string;
          status?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      project_submissions: {
        Row: {
          id: string;
          project_id: string;
          candidate_id: string;
          repository_url: string;
          deployment_url: string | null;
          submission_notes: string;
          submitted_at: string;
          status: SubmissionStatus;
        };
        Insert: {
          id?: string;
          project_id: string;
          candidate_id: string;
          repository_url: string;
          deployment_url?: string | null;
          submission_notes: string;
          submitted_at?: string;
          status?: SubmissionStatus;
        };
        Update: {
          repository_url?: string;
          deployment_url?: string | null;
          submission_notes?: string;
          status?: SubmissionStatus;
        };
        Relationships: [];
      };
      project_feedback: {
        Row: {
          id: string;
          project_id: string;
          candidate_id: string;
          company_id: string;
          reviewer_id: string;
          requirements_completed: boolean;
          technical_quality: string;
          completeness: string;
          testing_quality: string;
          documentation_quality: string;
          deadline_met: boolean;
          revisions_required: number;
          written_feedback: string;
          what_was_missing: string | null;
          would_interview_or_hire: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          candidate_id: string;
          company_id: string;
          reviewer_id: string;
          requirements_completed?: boolean;
          technical_quality: string;
          completeness: string;
          testing_quality: string;
          documentation_quality: string;
          deadline_met?: boolean;
          revisions_required?: number;
          written_feedback: string;
          what_was_missing?: string | null;
          would_interview_or_hire: string;
          created_at?: string;
        };
        Update: {
          requirements_completed?: boolean;
          technical_quality?: string;
          completeness?: string;
          testing_quality?: string;
          documentation_quality?: string;
          deadline_met?: boolean;
          revisions_required?: number;
          written_feedback?: string;
          what_was_missing?: string | null;
          would_interview_or_hire?: string;
        };
        Relationships: [];
      };
      project_outcomes: {
        Row: {
          id: string;
          project_id: string;
          candidate_id: string;
          outcome: ProjectOutcomeType;
          reason: string | null;
          interview_date: string | null;
          hired_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          candidate_id: string;
          outcome: ProjectOutcomeType;
          reason?: string | null;
          interview_date?: string | null;
          hired_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          outcome?: ProjectOutcomeType;
          reason?: string | null;
          interview_date?: string | null;
          hired_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          project_id: string;
          company_id: string;
          candidate_id: string | null;
          provider: string;
          provider_payment_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          company_id: string;
          candidate_id?: string | null;
          provider?: string;
          provider_payment_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_payment_id?: string | null;
          status?: PaymentStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          link_url: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          link_url?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [];
      };
      admin_notes: {
        Row: {
          id: string;
          admin_id: string;
          target_type: string;
          target_id: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          target_type: string;
          target_id: string;
          note: string;
          created_at?: string;
        };
        Update: {
          note?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          action?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_company_member: {
        Args: { lookup_company_id: string };
        Returns: boolean;
      };
      get_current_candidate_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      application_status: ApplicationStatus;
      submission_status: SubmissionStatus;
      project_outcome_type: ProjectOutcomeType;
      payment_status: PaymentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
