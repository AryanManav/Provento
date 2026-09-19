import { describe, expect, it } from "vitest";
import { ACTIVITY_WEEKS, activityDay, buildActivityCalendar } from "@/lib/activity";

// 2026-09-19 is a Saturday.
const TODAY = "2026-09-19";

describe("activityDay", () => {
  it("uses the Indian calendar day, not UTC", () => {
    // 20:00 UTC on the 18th is 01:30 on the 19th in India.
    expect(activityDay(new Date("2026-09-18T20:00:00Z"))).toBe("2026-09-19");
    expect(activityDay(new Date("2026-09-18T18:00:00Z"))).toBe("2026-09-18");
  });
});

describe("buildActivityCalendar", () => {
  it("counts a streak that includes today", () => {
    const calendar = buildActivityCalendar(
      ["2026-09-17", "2026-09-18", "2026-09-19"],
      TODAY
    );
    expect(calendar.streak).toBe(3);
    expect(calendar.streakAtRisk).toBe(false);
  });

  it("keeps yesterday's streak alive until today ends", () => {
    const calendar = buildActivityCalendar(["2026-09-17", "2026-09-18"], TODAY);
    expect(calendar.streak).toBe(2);
    expect(calendar.streakAtRisk).toBe(true);
  });

  it("breaks the streak after a missed day", () => {
    const calendar = buildActivityCalendar(["2026-09-16", "2026-09-17"], TODAY);
    expect(calendar.streak).toBe(0);
    expect(calendar.longestStreak).toBe(2);
  });

  it("counts a day once however many activities it had, and grades intensity", () => {
    const calendar = buildActivityCalendar(
      ["2026-09-19", "2026-09-19", "2026-09-19T10:00:00Z", "2026-09-18"],
      TODAY
    );
    const cells = calendar.weeks.flat();
    expect(calendar.activeDays).toBe(2);
    expect(cells.find((cell) => cell.day === TODAY)?.level).toBe(3);
    expect(cells.find((cell) => cell.day === "2026-09-18")?.level).toBe(1);
  });

  it("lays out Monday-first weeks ending in the current week", () => {
    const calendar = buildActivityCalendar([], TODAY);
    expect(calendar.weeks).toHaveLength(ACTIVITY_WEEKS);
    const last = calendar.weeks[ACTIVITY_WEEKS - 1];
    expect(last[0].day).toBe("2026-09-14");
    expect(last[5]).toMatchObject({ day: TODAY, future: false });
    expect(last[6]).toMatchObject({ day: "2026-09-20", future: true });
  });

  it("labels the columns where a month begins", () => {
    const calendar = buildActivityCalendar([], TODAY);
    const labelled = calendar.monthLabels.filter(Boolean);
    expect(labelled).toContain("Sep");
    expect(labelled.length).toBeGreaterThanOrEqual(3);
  });
});
