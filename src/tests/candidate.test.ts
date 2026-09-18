import { describe, it, expect } from "vitest";
import {
  candidateProfileSchema,
  candidateSkillSchema,
  candidateProjectSchema,
  candidateSkillUpdateSchema,
  candidateProjectUpdateSchema,
} from "../lib/validations/candidate";

describe("Candidate System Validation Schemas", () => {
  describe("candidateProfileSchema", () => {
    it("validates a complete candidate profile payload", () => {
      const result = candidateProfileSchema.safeParse({
        headline: "Junior Backend Developer | Node.js & PostgreSQL",
        bio: "Passionate about building clean REST APIs and data modeling.",
        location: "Bengaluru, Karnataka",
        education: "B.Tech Computer Science - PES University",
        graduationYear: 2025,
        resumeUrl: "https://drive.google.com/file/d/123/view",
        githubUrl: "https://github.com/aaravdeveloper",
        portfolioUrl: "https://aarav.dev",
        linkedinUrl: "https://linkedin.com/in/aaravdeveloper",
        availability: "immediate",
      });
      expect(result.success).toBe(true);
    });

    it("allows empty optional URLs", () => {
      const result = candidateProfileSchema.safeParse({
        headline: "Aspiring Frontend Developer",
        resumeUrl: "",
        githubUrl: "",
        portfolioUrl: "",
        linkedinUrl: "",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URLs", () => {
      const result = candidateProfileSchema.safeParse({
        githubUrl: "not-a-valid-url",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("candidateSkillSchema", () => {
    it("accepts valid technical skills", () => {
      const result = candidateSkillSchema.safeParse({
        skillName: "PostgreSQL",
        skillLevel: "intermediate",
        yearsExperience: 2,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid skill proficiency levels", () => {
      const result = candidateSkillSchema.safeParse({
        skillName: "Rust",
        skillLevel: "expert_ninja", // invalid enum
        yearsExperience: 1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty skill names", () => {
      const result = candidateSkillSchema.safeParse({
        skillName: "A",
        skillLevel: "beginner",
        yearsExperience: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("candidateProjectSchema", () => {
    it("accepts valid showcase project", () => {
      const result = candidateProjectSchema.safeParse({
        title: "Real-Time Chat Microservice",
        description:
          "Built a WebSockets-based chat service with Redis pub/sub and MongoDB message persistence.",
        technologies: "Node.js, WebSockets, Redis, MongoDB",
        repositoryUrl: "https://github.com/user/chat-service",
        liveUrl: "https://chat-service.up.railway.app",
      });
      expect(result.success).toBe(true);
    });

    it("rejects projects with too short description", () => {
      const result = candidateProjectSchema.safeParse({
        title: "Chat App",
        description: "Short",
        technologies: "Node.js",
      });
      expect(result.success).toBe(false);
    });
  });

  it("validates identifiers before updating a candidate skill or project", () => {
    expect(
      candidateSkillUpdateSchema.safeParse({
        skillId: "not-a-uuid",
        skillName: "React",
        skillLevel: "advanced",
        yearsExperience: 2,
      }).success
    ).toBe(false);
    expect(
      candidateProjectUpdateSchema.safeParse({
        projectId: "9f59a967-7782-4975-bac4-1ff6cc8e765d",
        title: "Portfolio API",
        description: "A documented and tested API project.",
        technologies: "TypeScript",
        repositoryUrl: "",
        liveUrl: "",
      }).success
    ).toBe(true);
  });
});
