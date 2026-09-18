import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  projectFeedbackSchema,
  projectOutcomeSchema,
  reviewSubmissionSchema,
  submitWorkSchema,
} from "../lib/validations/evaluation";
import { CANDIDATE_ACTIVITY_TYPES } from "../lib/constants";

const PROJECT_ID = "9f59a967-7782-4975-bac4-1ff6cc8e765d";

describe("Evaluation loop schemas", () => {
  describe("submitWorkSchema", () => {
    it("accepts a submission with a repository and explanation", () => {
      const result = submitWorkSchema.safeParse({
        projectId: PROJECT_ID,
        repositoryUrl: "https://github.com/aarav/inventory-api",
        deploymentUrl: "https://inventory-api.up.railway.app",
        submissionNotes:
          "Built the CRUD endpoints with JWT auth and added integration tests for the stock adjustment path.",
      });
      expect(result.success).toBe(true);
    });

    it("allows an empty deployment URL", () => {
      const result = submitWorkSchema.safeParse({
        projectId: PROJECT_ID,
        repositoryUrl: "https://github.com/aarav/inventory-api",
        deploymentUrl: "",
        submissionNotes: "Backend only, so there is no deployed front end to show.",
      });
      expect(result.success).toBe(true);
    });

    it("requires a repository URL, since the commit trail is the evidence", () => {
      const result = submitWorkSchema.safeParse({
        projectId: PROJECT_ID,
        repositoryUrl: "",
        submissionNotes: "Attached the finished files in an email instead of a repo.",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a one-word submission note", () => {
      const result = submitWorkSchema.safeParse({
        projectId: PROJECT_ID,
        repositoryUrl: "https://github.com/aarav/inventory-api",
        submissionNotes: "done",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("reviewSubmissionSchema", () => {
    it("accepts the three review decisions", () => {
      for (const decision of ["accepted", "revision_requested", "rejected"]) {
        const result = reviewSubmissionSchema.safeParse({
          submissionId: PROJECT_ID,
          decision,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects an unknown decision", () => {
      const result = reviewSubmissionSchema.safeParse({
        submissionId: PROJECT_ID,
        decision: "maybe_later",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("projectFeedbackSchema", () => {
    const validFeedback = {
      projectId: PROJECT_ID,
      requirementsCompleted: true,
      technicalQuality: "meets_expectations",
      completeness: "exceeds_expectations",
      testingQuality: "below_expectations",
      documentationQuality: "meets_expectations",
      deadlineMet: true,
      revisionsRequired: 1,
      writtenFeedback:
        "Schema design was clean and the auth flow was correct. Test coverage was thin around edge cases.",
      whatWasMissing: "No tests for concurrent stock updates.",
      wouldInterviewOrHire: "interview",
    };

    it("accepts a complete evaluation", () => {
      expect(projectFeedbackSchema.safeParse(validFeedback).success).toBe(true);
    });

    it("rejects numeric quality scores, which imply precision we cannot justify", () => {
      const result = projectFeedbackSchema.safeParse({
        ...validFeedback,
        technicalQuality: "8.9",
      });
      expect(result.success).toBe(false);
    });

    it("requires feedback substantial enough to be useful to the candidate", () => {
      const result = projectFeedbackSchema.safeParse({
        ...validFeedback,
        writtenFeedback: "good job",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an unsupported hiring recommendation", () => {
      const result = projectFeedbackSchema.safeParse({
        ...validFeedback,
        wouldInterviewOrHire: "probably",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("projectOutcomeSchema", () => {
    it("treats no_hire as a valid recorded outcome", () => {
      const result = projectOutcomeSchema.safeParse({
        projectId: PROJECT_ID,
        outcome: "no_hire",
        reason: "Strong engineer but we paused the role this quarter.",
      });
      expect(result.success).toBe(true);
    });

    it("rejects outcomes that are not reviewer-recordable", () => {
      const result = projectOutcomeSchema.safeParse({
        projectId: PROJECT_ID,
        outcome: "project_cancelled",
      });
      expect(result.success).toBe(false);
    });
  });
});

/**
 * activity_type is a CHECK constraint, not an enum, so Postgres rejects an
 * unknown value at runtime while TypeScript sees a plain string. A bad value
 * shipped once this way; parsing the migration keeps the guard honest if the
 * allowed set ever changes.
 */
describe("candidate activity types match the database CHECK constraint", () => {
  const migration = readFileSync(
    join(
      __dirname,
      "..",
      "..",
      "supabase",
      "migrations",
      "20260914000003_candidate_activity.sql"
    ),
    "utf8"
  );

  const allowed = new Set(
    (migration.match(/activity_type IN \(([^)]*)\)/) ?? ["", ""])[1]
      .split(",")
      .map((value) => value.trim().replace(/^'|'$/g, ""))
      .filter(Boolean)
  );

  it("parses the allowed values out of the migration", () => {
    expect(allowed.size).toBeGreaterThan(0);
  });

  it.each(Object.entries(CANDIDATE_ACTIVITY_TYPES))(
    "%s is accepted by the constraint",
    (_key, value) => {
      expect(allowed.has(value)).toBe(true);
    }
  );
});
