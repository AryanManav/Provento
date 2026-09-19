import { describe, it, expect } from "vitest";
import { computeThreadEvidence, formatDuration } from "../lib/evidence";
import {
  isAllowedAttachment,
  projectMessageSchema,
  submissionAttachmentsSchema,
} from "../lib/validations/evaluation";
import { withdrawApplicationSchema } from "../lib/validations/application";
import { createProjectSchema } from "../lib/validations/project";

const PROJECT_ID = "9f59a967-7782-4975-bac4-1ff6cc8e765d";
const at = (minutes: number) => new Date(Date.UTC(2026, 8, 20, 9, minutes)).toISOString();

describe("clarification thread evidence", () => {
  it("reports nothing to measure for an empty thread", () => {
    expect(computeThreadEvidence([])).toEqual({
      messages: 0,
      companyQuestions: 0,
      candidateReplies: 0,
      candidateMedianResponseMs: null,
    });
  });

  it("measures the wait from a company message to the candidate's reply", () => {
    const evidence = computeThreadEvidence([
      { authorRole: "company", createdAt: at(0) },
      { authorRole: "candidate", createdAt: at(30) },
    ]);
    expect(evidence.candidateReplies).toBe(1);
    expect(evidence.candidateMedianResponseMs).toBe(30 * 60_000);
  });

  it("times consecutive company follow-ups from the first one", () => {
    const evidence = computeThreadEvidence([
      { authorRole: "company", createdAt: at(0) },
      { authorRole: "company", createdAt: at(20) },
      { authorRole: "candidate", createdAt: at(40) },
    ]);
    expect(evidence.candidateReplies).toBe(1);
    expect(evidence.candidateMedianResponseMs).toBe(40 * 60_000);
  });

  it("does not count a candidate's opening question as a response", () => {
    const evidence = computeThreadEvidence([
      { authorRole: "candidate", createdAt: at(0) },
      { authorRole: "company", createdAt: at(10) },
    ]);
    expect(evidence.candidateReplies).toBe(0);
    expect(evidence.candidateMedianResponseMs).toBeNull();
    expect(evidence.companyQuestions).toBe(1);
  });

  it("takes the median across several exchanges, regardless of input order", () => {
    const evidence = computeThreadEvidence([
      { authorRole: "candidate", createdAt: at(50) },
      { authorRole: "company", createdAt: at(0) },
      { authorRole: "candidate", createdAt: at(10) },
      { authorRole: "company", createdAt: at(20) },
      { authorRole: "company", createdAt: at(45) },
      { authorRole: "candidate", createdAt: at(55) },
    ]);
    // Sorted: co 0, cand 10, co 20, co 45, cand 50, cand 55.
    // Waits: 0→10 = 10 min; 20→50 = 30 min (45 is a follow-up inside that wait);
    // the 55 message answers nothing new. Median of [10, 30] = 20 min.
    expect(evidence.candidateReplies).toBe(2);
    expect(evidence.candidateMedianResponseMs).toBe(20 * 60_000);
  });

  it("formats durations for people, not milliseconds", () => {
    expect(formatDuration(20_000)).toBe("under a minute");
    expect(formatDuration(45 * 60_000)).toBe("45 min");
    expect(formatDuration(6 * 60 * 60_000)).toBe("6 h");
    expect(formatDuration(3 * 24 * 60 * 60_000)).toBe("3 days");
  });
});

describe("project messages", () => {
  it("accepts a normal question", () => {
    expect(
      projectMessageSchema.safeParse({
        projectId: PROJECT_ID,
        body: "Is pagination required?",
      }).success
    ).toBe(true);
  });

  it("rejects a blank or whitespace-only message", () => {
    expect(
      projectMessageSchema.safeParse({ projectId: PROJECT_ID, body: "   " }).success
    ).toBe(false);
  });

  it("rejects a message over 2000 characters", () => {
    expect(
      projectMessageSchema.safeParse({ projectId: PROJECT_ID, body: "a".repeat(2001) })
        .success
    ).toBe(false);
  });
});

describe("submission attachments", () => {
  const file = {
    path: `${PROJECT_ID}/user/1-report.pdf`,
    name: "report.pdf",
    size: 1024,
    type: "application/pdf",
  };

  it("allows documents, notebooks, archives and images", () => {
    for (const name of [
      "report.pdf",
      "analysis.ipynb",
      "source.zip",
      "diagram.PNG",
      "data.csv",
    ]) {
      expect(isAllowedAttachment(name)).toBe(true);
    }
  });

  it("blocks anything a browser would render or execute", () => {
    for (const name of [
      "page.html",
      "logo.svg",
      "script.js",
      "noextension",
      "tricky.pdf.exe",
    ]) {
      expect(isAllowedAttachment(name)).toBe(false);
    }
  });

  it("accepts up to five files", () => {
    expect(submissionAttachmentsSchema.safeParse(Array(5).fill(file)).success).toBe(true);
  });

  it("rejects a sixth file", () => {
    expect(submissionAttachmentsSchema.safeParse(Array(6).fill(file)).success).toBe(
      false
    );
  });

  it("rejects a file over 25 MB", () => {
    expect(
      submissionAttachmentsSchema.safeParse([{ ...file, size: 25 * 1024 * 1024 + 1 }])
        .success
    ).toBe(false);
  });
});

describe("withdrawing an application", () => {
  it("requires a real application id", () => {
    expect(
      withdrawApplicationSchema.safeParse({ applicationId: PROJECT_ID }).success
    ).toBe(true);
    expect(
      withdrawApplicationSchema.safeParse({ applicationId: "1; drop" }).success
    ).toBe(false);
  });
});

describe("project work mode", () => {
  const base = {
    title: "Build REST API for Inventory System",
    category: "backend",
    description:
      "Develop a clean Node.js and PostgreSQL REST API for warehouse stock tracking.",
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

  it("defaults to building locally", () => {
    const result = createProjectSchema.safeParse(base);
    expect(result.success && result.data.workMode).toBe("local");
  });

  it("refuses in-app projects until the editor exists", () => {
    expect(createProjectSchema.safeParse({ ...base, workMode: "in_app" }).success).toBe(
      false
    );
  });
});
