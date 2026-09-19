/**
 * The consistency calendar on the candidate dashboard.
 *
 * Every day here is a calendar date in one time zone, recorded and read the
 * same way. Mixing the database's UTC `CURRENT_DATE` with the server's local
 * midnight put activity on the wrong square and zeroed the streak.
 */

/** Trialent's pilots run in India, so a "day" is an Indian calendar day. */
export const ACTIVITY_TIME_ZONE = "Asia/Kolkata";

/** Weeks shown in the calendar. */
export const ACTIVITY_WEEKS = 13;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ACTIVITY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `YYYY-MM-DD` for the given instant, in the activity time zone. */
export function activityDay(instant: Date = new Date()): string {
  return dayFormatter.format(instant);
}

/** Calendar arithmetic on `YYYY-MM-DD` strings, free of any time zone. */
function shiftDay(day: string, by: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + by);
  return date.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday. */
function weekdayOf(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export type ActivityLevel = 0 | 1 | 2 | 3;

export interface ActivityCell {
  day: string;
  /** Distinct kinds of progress made that day. */
  count: number;
  level: ActivityLevel;
  /** Later this week; drawn as a blank so the grid stays aligned. */
  future: boolean;
}

export interface ActivityCalendar {
  /** Oldest week first; each week runs Monday → Sunday. */
  weeks: ActivityCell[][];
  /** Month label for the week column where a month starts. */
  monthLabels: (string | null)[];
  streak: number;
  /** True while today is still empty but yesterday kept the streak going. */
  streakAtRisk: boolean;
  longestStreak: number;
  activeDays: number;
  today: string;
}

function levelFor(count: number): ActivityLevel {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

/**
 * Build the calendar from activity dates (one entry per recorded activity, so
 * a day can appear more than once).
 */
export function buildActivityCalendar(
  activityDates: string[],
  today: string = activityDay()
): ActivityCalendar {
  const counts = new Map<string, number>();
  for (const raw of activityDates) {
    const day = raw.slice(0, 10);
    if (day > today) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  // A streak survives until today ends: an empty today still counts yesterday.
  const activeToday = counts.has(today);
  let cursor = activeToday ? today : shiftDay(today, -1);
  let streak = 0;
  while (counts.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }

  const start = shiftDay(today, -weekdayOf(today) - (ACTIVITY_WEEKS - 1) * 7);
  const weeks: ActivityCell[][] = [];
  const monthLabels: (string | null)[] = [];
  let activeDays = 0;
  let longestStreak = 0;
  let run = 0;

  for (let week = 0; week < ACTIVITY_WEEKS; week += 1) {
    const cells: ActivityCell[] = [];
    let label: string | null = null;
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = shiftDay(start, week * 7 + weekday);
      const future = day > today;
      const count = future ? 0 : (counts.get(day) ?? 0);
      if (!future) {
        if (count > 0) {
          activeDays += 1;
          run += 1;
          longestStreak = Math.max(longestStreak, run);
        } else {
          run = 0;
        }
      }
      // Label the first column, and each column where a new month begins.
      if (!future && (week === 0 ? weekday === 0 : day.endsWith("-01"))) {
        label = monthFormatter.format(new Date(`${day.slice(0, 7)}-01T00:00:00Z`));
      }
      cells.push({ day, count, level: levelFor(count), future });
    }
    weeks.push(cells);
    monthLabels.push(label);
  }
  // Two labels side by side would overlap; the new month wins.
  if (monthLabels[1]) monthLabels[0] = null;

  return {
    weeks,
    monthLabels,
    streak,
    streakAtRisk: streak > 0 && !activeToday,
    longestStreak: Math.max(longestStreak, streak),
    activeDays,
    today,
  };
}
