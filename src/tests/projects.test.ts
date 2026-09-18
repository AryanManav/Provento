import { describe, it, expect } from "vitest";
import { projectAvailability, spotsLeft } from "../lib/projects";
import { createProjectSchema, updateApplicationStatusSchema } from "../lib/validations";

const now = new Date("2026-09-18T12:00:00.000Z");
const future = "2026-09-25T00:00:00.000Z";
const past = "2026-09-10T00:00:00.000Z";
const base = {
  status: "applications_open" as const,
  applicationDeadline: future,
  maxApplicants: null,
  applicationCount: 0,
};

describe("browse availability", () => {
  it("is open before the deadline with room", () => {
    expect(projectAvailability(base, now)).toBe("open");
  });

  it("stays listed as selected once a candidate is picked, until the deadline", () => {
    for (const status of [
      "candidate_selected",
      "in_progress",
      "submitted",
      "under_review",
      "revision_requested",
    ] as const) {
      expect(projectAvailability({ ...base, status }, now)).toBe("selected");
    }
  });

  it("closes at the deadline and when finished", () => {
    expect(projectAvailability({ ...base, applicationDeadline: past }, now)).toBe(
      "closed"
    );
    expect(projectAvailability({ ...base, status: "completed" }, now)).toBe("closed");
    expect(projectAvailability({ ...base, status: "cancelled" }, now)).toBe("closed");
  });

  it("is full once the cap is reached", () => {
    expect(
      projectAvailability({ ...base, maxApplicants: 3, applicationCount: 2 }, now)
    ).toBe("open");
    expect(
      projectAvailability({ ...base, maxApplicants: 3, applicationCount: 3 }, now)
    ).toBe("full");
  });

  it("counts places left only when there is a cap", () => {
    expect(spotsLeft(null, 5)).toBe(null);
    expect(spotsLeft(10, 4)).toBe(6);
    expect(spotsLeft(3, 5)).toBe(0);
  });
});

describe("company decisions", () => {
  const id = "9f59a967-7782-4975-bac4-1ff6cc8e765d";
  it("offers reviewing, selected and rejected — not shortlisted", () => {
    for (const status of ["reviewing", "selected", "rejected"]) {
      expect(
        updateApplicationStatusSchema.safeParse({ applicationId: id, status }).success
      ).toBe(true);
    }
    expect(
      updateApplicationStatusSchema.safeParse({
        applicationId: id,
        status: "shortlisted",
      }).success
    ).toBe(false);
  });
});

describe("applicant limit", () => {
  const project = {
    title: "Build REST API for Inventory System",
    description: "Develop a clean Node.js and PostgreSQL REST API for warehouse stock.",
    problemStatement:
      "Current warehouse team faces discrepancy issues with spreadsheet logging.",
    context: "We are a 12 person logistics startup moving off spreadsheets this quarter.",
    requirements: ["CRUD endpoints"],
    deliverables: ["Repository"],
    acceptanceCriteria: ["Tests pass"],
    evaluationCriteria: ["Code quality"],
    expectedHours: 8,
    paymentAmount: 5000,
    applicationDeadline: "2026-10-01T00:00:00.000Z",
    projectDeadline: "2026-10-10T00:00:00.000Z",
  };

  it("is optional", () => {
    const parsed = createProjectSchema.safeParse({ ...project, maxApplicants: "" });
    expect(parsed.success && parsed.data.maxApplicants).toBe(undefined);
  });

  it("accepts a whole number from 1 to 500", () => {
    const parsed = createProjectSchema.safeParse({ ...project, maxApplicants: "20" });
    expect(parsed.success && parsed.data.maxApplicants).toBe(20);
    for (const bad of ["0", "501", "2.5"]) {
      expect(
        createProjectSchema.safeParse({ ...project, maxApplicants: bad }).success
      ).toBe(false);
    }
  });
});

describe("decision messages", () => {
  const submissionId = "9f59a967-7782-4975-bac4-1ff6cc8e765d";

  it("requires a message when asking for a revision", async () => {
    const { reviewSubmissionSchema } = await import("../lib/validations/evaluation");
    expect(
      reviewSubmissionSchema.safeParse({
        submissionId,
        decision: "revision_requested",
        reviewNote: "  ",
      }).success
    ).toBe(false);
    expect(
      reviewSubmissionSchema.safeParse({
        submissionId,
        decision: "revision_requested",
        reviewNote: "Add tests for the auth routes.",
      }).success
    ).toBe(true);
  });

  it("keeps the message optional for accept and reject, and trims blanks to null", async () => {
    const { reviewSubmissionSchema } = await import("../lib/validations/evaluation");
    const parsed = reviewSubmissionSchema.safeParse({
      submissionId,
      decision: "accepted",
      reviewNote: "   ",
    });
    expect(parsed.success && parsed.data.reviewNote).toBe(null);
  });

  it("caps an application decision message at 1000 characters", () => {
    expect(
      updateApplicationStatusSchema.safeParse({
        applicationId: submissionId,
        status: "rejected",
        decisionNote: "a".repeat(1001),
      }).success
    ).toBe(false);
  });
});
