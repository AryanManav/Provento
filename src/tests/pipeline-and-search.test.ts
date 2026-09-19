import { describe, expect, it } from "vitest";
import { pipelineHref, pipelineStage } from "../lib/company";
import {
  filterCandidates,
  filterCompanies,
  parseDirectoryFilters,
  parseSearchType,
} from "../lib/search";
import type { SearchResult } from "../lib/types/domain";

describe("hiring pipeline", () => {
  it("places applications before selection by their own status", () => {
    expect(pipelineStage("submitted", null)).toBe("new");
    expect(pipelineStage("reviewing", null)).toBe("reviewing");
    expect(pipelineStage("rejected", null)).toBe("rejected");
    expect(pipelineStage("withdrawn", null)).toBe("withdrawn");
  });

  it("follows the candidate's work once selected", () => {
    expect(pipelineStage("selected", "in_progress")).toBe("building");
    expect(pipelineStage("selected", "revision_requested")).toBe("building");
    expect(pipelineStage("selected", "submitted")).toBe("to_evaluate");
    expect(pipelineStage("selected", "under_review")).toBe("to_evaluate");
    expect(pipelineStage("selected", "completed")).toBe("accepted");
    expect(pipelineStage("selected", "not_accepted")).toBe("not_accepted");
  });

  it("opens the application before selection and the evaluation after", () => {
    const entry = { projectId: "p", applicationId: "a", candidateId: "c" };
    expect(pipelineHref({ ...entry, applicationStatus: "reviewing" })).toBe(
      "/company/projects/p/applicants/a"
    );
    expect(pipelineHref({ ...entry, applicationStatus: "selected" })).toBe(
      "/company/projects/p/review/c"
    );
  });
});

describe("search filters", () => {
  const result = (overrides: Partial<SearchResult>): SearchResult => ({
    kind: "candidate",
    id: "x",
    title: "Asha",
    subtitle: null,
    imageUrl: null,
    location: "Delhi",
    skills: ["React", "TypeScript"],
    verifiedCount: 0,
    openProjects: 0,
    companySize: null,
    ...overrides,
  });

  it("falls back to All for unknown tabs", () => {
    expect(parseSearchType("candidates")).toBe("candidates");
    expect(parseSearchType("people")).toBe("all");
    expect(parseSearchType(undefined)).toBe("all");
  });

  it("filters candidates by skill, location and verified work", () => {
    const list = [
      result({ id: "a" }),
      result({ id: "b", location: "Pune" }),
      result({ id: "c", verifiedCount: 2 }),
    ];
    expect(
      filterCandidates(list, parseDirectoryFilters({ skill: "react", location: "del" }))
    ).toHaveLength(2);
    expect(
      filterCandidates(list, parseDirectoryFilters({ verified: "1" })).map((r) => r.id)
    ).toEqual(["c"]);
  });

  it("filters companies to those hiring now", () => {
    const list = [
      result({ kind: "company", id: "a" }),
      result({ kind: "company", id: "b", openProjects: 1 }),
    ];
    expect(
      filterCompanies(list, parseDirectoryFilters({ hiring: "1" })).map((r) => r.id)
    ).toEqual(["b"]);
  });
});
