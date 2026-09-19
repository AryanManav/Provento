import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applicationHref, applicationStage } from "../lib/applications";
import { inHireTab, pipelineHref, pipelineStage } from "../lib/company";
import { filterProjects, parseProjectFilters } from "../lib/projects";
import { createHiringSchema } from "../lib/validations/project";
import type { ApplicationSummaryView } from "../lib/types/domain";

const future = new Date(Date.now() + 7 * 86_400_000).toISOString();

const role = {
  title: "Frontend Developer",
  category: "frontend",
  jobType: "full_time",
  workArrangement: "remote",
  experienceLevel: "junior",
  description: "Build the web app our customers use every day.",
  aboutRole: "You'll own the React front end, from design handoff to production.",
  responsibilities: ["Ship features"],
  requirements: ["React"],
  niceToHave: [],
  openings: 5,
  maxApplicants: 100,
  applicationDeadline: future,
};

describe("hire-only postings", () => {
  it("need openings and an application limit, and the limit covers the openings", () => {
    expect(createHiringSchema.safeParse(role).success).toBe(true);
    expect(createHiringSchema.safeParse({ ...role, maxApplicants: 3 }).success).toBe(
      false
    );
    expect(createHiringSchema.safeParse({ ...role, openings: 0 }).success).toBe(false);
  });

  it("carry no fee, project or trial fields", () => {
    const parsed = createHiringSchema.parse(role);
    expect(parsed).not.toHaveProperty("paymentAmount");
    expect(parsed).not.toHaveProperty("deliverables");
    expect(parsed).not.toHaveProperty("projectDeadline");
  });
});

describe("the candidate's hiring stages", () => {
  it("runs Applied → Shortlisted → Interview → Selected, never a trial", () => {
    expect(applicationStage("submitted", "applications_open", null, "hire")).toBe(
      "applied"
    );
    expect(applicationStage("shortlisted", "applications_open", null, "hire")).toBe(
      "shortlisted"
    );
    expect(applicationStage("interview", "applications_open", null, "hire")).toBe(
      "interview"
    );
    expect(applicationStage("selected", "completed", null, "hire")).toBe("hired");
    // The same status on a build project is the start of paid work.
    expect(applicationStage("selected", "in_progress", "in_progress", "build")).toBe(
      "building"
    );
  });

  it("never sends a hired candidate to a trial workspace", () => {
    const application = (opportunityType: "hire" | "build"): ApplicationSummaryView => ({
      id: "a",
      status: "selected",
      decisionNote: null,
      workStatus: null,
      coverMessage: "",
      createdAt: future,
      project: {
        id: "p",
        slug: "role",
        title: "Role",
        status: "applications_open",
        paymentAmount: 0,
        currency: "INR",
        companyId: "c",
        companyName: "Acme",
        opportunityType,
      },
    });
    expect(applicationHref(application("hire"))).toBe("/projects/role");
    expect(applicationHref(application("build"))).toBe("/candidate/trials/p");
  });
});

describe("the company's hiring pipeline", () => {
  it("places hire applications in hiring stages and opens the application", () => {
    expect(pipelineStage("interview", null, "hire")).toBe("interview");
    expect(pipelineStage("selected", null, "hire")).toBe("hired");
    expect(
      pipelineHref({
        projectId: "p",
        applicationId: "a",
        candidateId: "c",
        applicationStatus: "selected",
        opportunityType: "hire",
      })
    ).toBe("/company/projects/p/applicants/a");
  });

  it("groups statuses into the pipeline tabs", () => {
    expect(inHireTab("new", "submitted")).toBe(true);
    expect(inHireTab("new", "reviewing")).toBe(true);
    expect(inHireTab("interview", "shortlisted")).toBe(false);
    expect(inHireTab("all", "withdrawn")).toBe(true);
  });
});

describe("browsing by type", () => {
  const base = {
    title: "t",
    description: "d",
    companyName: "Acme",
    stack: [],
    category: "frontend" as const,
    expectedHours: 8,
    availability: "open" as const,
  };
  const roleRow = {
    ...base,
    opportunityType: "hire" as const,
    paymentAmount: 0,
    jobType: "full_time" as const,
    workArrangement: "remote" as const,
  };
  const projectRow = { ...base, opportunityType: "build" as const, paymentAmount: 5000 };

  it("filters to one type, and fee filters only ever match build projects", () => {
    expect(
      filterProjects([roleRow, projectRow], parseProjectFilters({ kind: "hire" }, []))
    ).toEqual([roleRow]);
    expect(
      filterProjects([roleRow, projectRow], parseProjectFilters({ pay: "2000" }, []))
    ).toEqual([projectRow]);
    expect(
      filterProjects([roleRow, projectRow], parseProjectFilters({ where: "remote" }, []))
    ).toEqual([roleRow]);
  });
});

describe("the hire-only migration", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20261005000000_hire_only.sql"),
    "utf8"
  );

  it("keeps build projects to one candidate and hire postings free", () => {
    expect(sql).toContain("NEW.openings := 1;");
    expect(sql).toContain("NEW.payment_amount := 0;");
  });

  it("enforces the application limit and the openings in the database", () => {
    expect(sql).toContain("This role has reached its application limit.");
    expect(sql).toContain("Every opening for this role has been filled.");
    expect(sql).toMatch(/FOR UPDATE/);
  });

  it("adds the interview status outside the transaction", () => {
    expect(sql.indexOf("ADD VALUE IF NOT EXISTS 'interview'")).toBeLessThan(
      sql.indexOf("BEGIN;")
    );
  });
});
