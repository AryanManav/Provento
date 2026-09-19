import { describe, it, expect } from "vitest";
import { followTargetSchema } from "../lib/validations/follow";
import { NOTIFICATION_TYPES } from "../lib/constants";

const id = "9f59a967-7782-4975-bac4-1ff6cc8e765d";

describe("following", () => {
  it("targets exactly one company or one candidate", () => {
    expect(followTargetSchema.safeParse({ companyId: id }).success).toBe(true);
    expect(followTargetSchema.safeParse({ candidateId: id }).success).toBe(true);
    expect(followTargetSchema.safeParse({}).success).toBe(false);
    expect(followTargetSchema.safeParse({ companyId: "not-an-id" }).success).toBe(false);
  });

  it("has a notification type for new projects from followed companies", () => {
    expect(NOTIFICATION_TYPES).toContain("new_project");
  });
});
