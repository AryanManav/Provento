import { describe, it, expect } from "vitest";
import {
  applicationHref,
  applicationStage,
  isClosedProject,
  summarizeApplications,
} from "../lib/applications";
import type { ApplicationSummaryView } from "../lib/types/domain";

const application = (
  status: ApplicationSummaryView["status"],
  projectStatus: NonNullable<ApplicationSummaryView["project"]>["status"]
): ApplicationSummaryView => ({
  id: "a1",
  status,
  coverMessage: "",
  createdAt: "2026-09-18T00:00:00.000Z",
  project: {
    id: "p1",
    slug: "build-an-api",
    title: "Build an API",
    status: projectStatus,
    paymentAmount: 3000,
    currency: "INR",
    companyName: "Acme",
  },
});

describe("application stage", () => {
  it("follows the project once the candidate is selected", () => {
    expect(applicationStage("selected", "candidate_selected")).toBe("building");
    expect(applicationStage("selected", "in_progress")).toBe("building");
    expect(applicationStage("selected", "submitted")).toBe("awaiting_review");
    expect(applicationStage("selected", "under_review")).toBe("awaiting_review");
    expect(applicationStage("selected", "revision_requested")).toBe("revision_requested");
    expect(applicationStage("selected", "completed")).toBe("completed");
    expect(applicationStage("selected", "cancelled")).toBe("cancelled");
  });

  it("uses the application status before selection", () => {
    expect(applicationStage("submitted", "applications_open")).toBe("applied");
    expect(applicationStage("shortlisted", "applications_open")).toBe("shortlisted");
    expect(applicationStage("rejected", "completed")).toBe("not_selected");
    expect(applicationStage("withdrawn", "applications_open")).toBe("withdrawn");
  });

  it("treats completed and cancelled projects as closed", () => {
    expect(isClosedProject("completed")).toBe(true);
    expect(isClosedProject("cancelled")).toBe(true);
    expect(isClosedProject("revision_requested")).toBe(false);
    expect(isClosedProject(null)).toBe(false);
  });
});

describe("where an application opens", () => {
  it("sends a selected candidate to the workspace, even after completion", () => {
    expect(applicationHref(application("selected", "in_progress"))).toBe(
      "/candidate/trials/p1"
    );
    expect(applicationHref(application("selected", "completed"))).toBe(
      "/candidate/trials/p1"
    );
  });

  it("sends everyone else to the public brief", () => {
    expect(applicationHref(application("shortlisted", "applications_open"))).toBe(
      "/projects/build-an-api"
    );
  });

  it("has no brief to link to once the project stops taking applications", () => {
    expect(applicationHref(application("rejected", "completed"))).toBe(null);
    expect(applicationHref(application("submitted", "candidate_selected"))).toBe(null);
  });

  it("has nowhere to go without a project", () => {
    expect(
      applicationHref({ ...application("submitted", "published"), project: null })
    ).toBe(null);
  });
});

describe("dashboard counts", () => {
  it("puts each application in exactly one bucket and sums completed fees", () => {
    const summary = summarizeApplications([
      application("submitted", "applications_open"),
      application("shortlisted", "applications_open"),
      application("selected", "in_progress"),
      application("selected", "revision_requested"),
      application("selected", "completed"),
      application("rejected", "completed"),
      application("withdrawn", "applications_open"),
    ]);
    expect(summary).toEqual({
      total: 7,
      pending: 2,
      activeTrials: 2,
      completed: 1,
      completedValue: 3000,
    });
  });

  it("moves an application from active to completed when the project closes", () => {
    expect(
      summarizeApplications([application("selected", "under_review")])
    ).toMatchObject({ activeTrials: 1, completed: 0 });
    expect(summarizeApplications([application("selected", "completed")])).toMatchObject({
      activeTrials: 0,
      completed: 1,
    });
  });
});

describe("company profile", () => {
  it("lists what a candidate would find missing", async () => {
    const { companyProfileCompleteness } = await import("../lib/company");
    expect(companyProfileCompleteness(null)).toMatchObject({ percent: 0 });
    const partial = companyProfileCompleteness({
      id: "c1",
      name: "Acme",
      website: "https://acme.com",
      description: "  ",
      industry: null,
      companySize: "11–50",
      location: "Pune",
      logoUrl: null,
      verified: false,
    });
    expect(partial.missing).toEqual(["Logo", "What you build", "Industry"]);
    expect(partial.percent).toBe(57);
  });

  it("only accepts web links for the website", async () => {
    const { companyProfileSchema } = await import("../lib/validations/company");
    const base = { name: "Acme" };
    expect(
      companyProfileSchema.safeParse({ ...base, website: "https://acme.com" }).success
    ).toBe(true);
    expect(companyProfileSchema.safeParse({ ...base, website: "" }).success).toBe(true);
    expect(
      companyProfileSchema.safeParse({ ...base, website: "javascript:alert(1)" }).success
    ).toBe(false);
  });
});
