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
  it("accepts the build and hiring decisions, never a candidate's own status", () => {
    for (const status of [
      "reviewing",
      "shortlisted",
      "interview",
      "selected",
      "rejected",
    ]) {
      expect(
        updateApplicationStatusSchema.safeParse({ applicationId: id, status }).success
      ).toBe(true);
    }
    for (const status of ["submitted", "withdrawn"]) {
      expect(
        updateApplicationStatusSchema.safeParse({ applicationId: id, status }).success
      ).toBe(false);
    }
  });
});

describe("applicant limit", () => {
  const project = {
    title: "Build REST API for Inventory System",
    category: "backend",
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

describe("project controls", () => {
  const projectId = "9f59a967-7782-4975-bac4-1ff6cc8e765d";

  it("accepts only public or private", async () => {
    const { projectVisibilitySchema } = await import("../lib/validations/project");
    expect(
      projectVisibilitySchema.safeParse({ projectId, visibility: "private" }).success
    ).toBe(true);
    expect(
      projectVisibilitySchema.safeParse({ projectId, visibility: "hidden" }).success
    ).toBe(false);
  });

  it("keeps the withdrawal reason optional and bounded", async () => {
    const { withdrawProjectSchema } = await import("../lib/validations/project");
    const blank = withdrawProjectSchema.safeParse({ projectId, reason: "" });
    expect(blank.success && blank.data.reason).toBe(null);
    expect(
      withdrawProjectSchema.safeParse({ projectId, reason: "x".repeat(1001) }).success
    ).toBe(false);
  });

  it("only lets a company manage a project before a candidate is selected", async () => {
    const { COMPANY_MANAGEABLE_PROJECT_STATUSES } = await import("../lib/constants");
    expect([...COMPANY_MANAGEABLE_PROJECT_STATUSES]).toEqual([
      "draft",
      "published",
      "applications_open",
    ]);
  });
});

describe("hire vs build projects", () => {
  const project = {
    title: "Build REST API for Inventory System",
    category: "backend",
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

  it("lets a hiring project have up to 10 openings", () => {
    const parsed = createProjectSchema.safeParse({
      ...project,
      purpose: "hire",
      openings: "3",
    });
    expect(parsed.success && parsed.data.openings).toBe(3);
    expect(
      createProjectSchema.safeParse({ ...project, purpose: "hire", openings: "11" })
        .success
    ).toBe(false);
  });

  it("keeps a build-only project to one candidate", () => {
    expect(
      createProjectSchema.safeParse({ ...project, purpose: "build", openings: "2" })
        .success
    ).toBe(false);
    expect(
      createProjectSchema.safeParse({ ...project, purpose: "build", openings: "1" })
        .success
    ).toBe(true);
  });

  it("labels what taking part means, by type", async () => {
    const { purposeLabel } = await import("../lib/projects");
    expect(purposeLabel({ opportunityType: "hire", purpose: "hire", openings: 1 })).toBe(
      "1 opening"
    );
    expect(purposeLabel({ opportunityType: "hire", purpose: "hire", openings: 5 })).toBe(
      "5 openings"
    );
    expect(
      purposeLabel({ opportunityType: "build", purpose: "build", openings: 1 })
    ).toBe("One candidate is selected");
  });
});

describe("each selected candidate's own cycle", () => {
  it("follows the candidate's work status, not the project's", async () => {
    const { applicationStage } = await import("../lib/applications");
    // The project is still open for more hires, but this candidate submitted.
    expect(applicationStage("selected", "applications_open", "submitted")).toBe(
      "awaiting_review"
    );
    expect(applicationStage("selected", "in_progress", "completed")).toBe("completed");
    expect(applicationStage("selected", "in_progress", "revision_requested")).toBe(
      "revision_requested"
    );
    expect(applicationStage("selected", "applications_open", "in_progress")).toBe(
      "building"
    );
  });

  it("treats a candidate's work as closed when finished or withdrawn", async () => {
    const { isClosedWork } = await import("../lib/applications");
    expect(isClosedWork({ workStatus: "completed", status: "in_progress" })).toBe(true);
    expect(isClosedWork({ workStatus: "in_progress", status: "cancelled" })).toBe(true);
    expect(isClosedWork({ workStatus: "submitted", status: "applications_open" })).toBe(
      false
    );
  });
});
