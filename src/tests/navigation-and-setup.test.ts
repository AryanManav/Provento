import { describe, it, expect } from "vitest";
import { homeFor, navbarActionFor, primaryNavFor } from "../lib/constants";
import { isCompanyReadyToPost } from "../lib/company";
import { companySetupSchema } from "../lib/validations/company";

const readyCompany = {
  name: "Acme Labs",
  description:
    "We build inventory software for small warehouses across India, and juniors work on our API.",
  industry: "Logistics",
  companySize: "11–50",
  location: "Pune",
};

describe("where each role lands", () => {
  it("sends every signed-in role to its own dashboard", () => {
    expect(homeFor("candidate")).toBe("/candidate/dashboard");
    expect(homeFor("company")).toBe("/company/dashboard");
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor(null)).toBe("/");
  });

  it("keeps the top navbar to what's outside the sidebar, so nothing repeats", () => {
    const hrefs = (role: Parameters<typeof primaryNavFor>[0]) =>
      primaryNavFor(role).map((link) => link.href);
    expect(hrefs("candidate")).toEqual(["/projects", "/companies"]);
    expect(hrefs("company")).toEqual([]);
    expect(hrefs(null)).toContain("/for-companies");
    expect(navbarActionFor("company")?.href).toBe("/company/projects/create");
    expect(navbarActionFor("candidate")).toBe(null);
  });
});

describe("company setup before posting", () => {
  it("is ready once the basics are filled in", () => {
    expect(isCompanyReadyToPost(readyCompany)).toBe(true);
  });

  it("isn't ready without a real description or the basics", () => {
    expect(isCompanyReadyToPost(null)).toBe(false);
    expect(isCompanyReadyToPost({ ...readyCompany, description: "We build apps." })).toBe(
      false
    );
    expect(isCompanyReadyToPost({ ...readyCompany, location: "  " })).toBe(false);
    expect(isCompanyReadyToPost({ ...readyCompany, companySize: null })).toBe(false);
  });

  it("validates the setup form the same way", () => {
    expect(companySetupSchema.safeParse({ ...readyCompany, website: "" }).success).toBe(
      true
    );
    expect(
      companySetupSchema.safeParse({
        ...readyCompany,
        website: "",
        description: "Too short",
      }).success
    ).toBe(false);
  });
});
