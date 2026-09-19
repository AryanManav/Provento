import { Flame } from "lucide-react";
import {
  buildActivityCalendar,
  type ActivityCalendar,
  type ActivityLevel,
} from "@/lib/activity";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<ActivityLevel, string> = {
  0: "bg-ink-100",
  1: "bg-money-200",
  2: "bg-money-400",
  3: "bg-money-600",
};

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const longDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function describe(day: string, count: number): string {
  const date = longDate.format(new Date(`${day}T00:00:00Z`));
  if (count === 0) return `${date}: no activity`;
  return `${date}: ${count} kind${count === 1 ? "" : "s"} of progress`;
}

/** Thirteen weeks of activity, Monday-first, shaded by how much happened. */
export function ActivityHeatmap({ calendar }: { calendar: ActivityCalendar }) {
  return (
    <div>
      <div
        role="img"
        aria-label={`${calendar.activeDays} active day${calendar.activeDays === 1 ? "" : "s"} in the last ${calendar.weeks.length} weeks`}
        className="grid grid-flow-col grid-rows-[auto_repeat(7,minmax(0,1fr))] gap-[3px] text-[9px] leading-none text-ink-400"
        style={{
          gridTemplateColumns: `auto repeat(${calendar.weeks.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={`weekday-${index}`} className="flex items-center pr-1">
            {label}
          </span>
        ))}
        {calendar.weeks.map((week, index) => [
          <span key={`month-${week[0].day}`} className="h-3 whitespace-nowrap">
            {calendar.monthLabels[index]}
          </span>,
          ...week.map((cell) =>
            cell.future ? (
              <span key={cell.day} className="aspect-square" />
            ) : (
              <span
                key={cell.day}
                title={describe(cell.day, cell.count)}
                className={cn(
                  "aspect-square rounded-[3px]",
                  LEVEL_CLASS[cell.level],
                  cell.day === calendar.today && "ring-1 ring-ink-400 ring-offset-1"
                )}
              />
            )
          ),
        ])}
      </div>
      <div
        className="mt-2 flex items-center justify-end gap-[3px] text-2xs text-ink-500"
        aria-hidden
      >
        Less
        {([0, 1, 2, 3] as const).map((level) => (
          <i
            key={level}
            className={cn("inline-block h-2.5 w-2.5 rounded-[2px]", LEVEL_CLASS[level])}
          />
        ))}
        More
      </div>
    </div>
  );
}

/** This week, Monday to Sunday: a filled dot for each day with progress. */
export function WeekStrip({ calendar }: { calendar: ActivityCalendar }) {
  const week = calendar.weeks[calendar.weeks.length - 1];
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label="This week">
      {week.map((cell, index) => {
        const active = cell.count > 0;
        return (
          <li key={cell.day} className="flex flex-col items-center gap-1">
            <span className="text-2xs text-ink-500">{WEEKDAYS[index]}</span>
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                cell.future
                  ? "border border-dashed border-ink-200"
                  : active
                    ? "bg-money-500"
                    : "border border-ink-300 bg-surface",
                cell.day === calendar.today && "ring-2 ring-ink-200 ring-offset-1"
              )}
            />
            <span className="sr-only">
              {cell.future ? "upcoming" : active ? "active" : "no activity"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The Trialent streak: consecutive days of real progress — applying, building,
 * submitting, answering a startup, updating a profile. Shown on the profile
 * as part of who someone is, and on the dashboard as a nudge.
 */
export function StreakCard({
  activityDates,
  viewer = "owner",
  firstName,
  heatmap = true,
}: {
  activityDates: string[];
  /** The owner gets a nudge; everyone else gets a description. */
  viewer?: "owner" | "public";
  firstName?: string;
  heatmap?: boolean;
}) {
  const calendar = buildActivityCalendar(activityDates);
  const { streak, streakAtRisk, longestStreak, activeDays } = calendar;

  return (
    <section
      aria-labelledby="streak-title"
      className="rounded-xl border border-line bg-surface p-4"
    >
      <h2
        id="streak-title"
        className="text-2xs font-semibold uppercase tracking-wider text-ink-500"
      >
        Trialent activity
      </h2>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="flex items-center gap-2">
          <Flame
            aria-hidden
            className={cn("h-5 w-5", streak > 0 ? "text-accent-500" : "text-ink-300")}
          />
          <span className="tabular text-2xl font-semibold leading-none text-ink-900">
            {streak}
          </span>
          <span className="text-sm text-ink-600">day streak</span>
        </p>
        <p className="text-right text-xs text-ink-500">
          Longest{" "}
          <span className="tabular font-medium text-ink-800">
            {longestStreak} day{longestStreak === 1 ? "" : "s"}
          </span>
        </p>
      </div>

      <div className="mt-4">
        <WeekStrip calendar={calendar} />
      </div>

      {heatmap && (
        <div className="mt-4 border-t border-line pt-3">
          <ActivityHeatmap calendar={calendar} />
        </div>
      )}

      <p className="mt-3 text-xs text-ink-500">
        {viewer === "public"
          ? `${activeDays} active day${activeDays === 1 ? "" : "s"} in the last 13 weeks${
              firstName ? ` — applying, building and delivering work on Trialent` : ""
            }.`
          : streak === 0
            ? "Apply, build, or post progress on a project to start a streak."
            : streakAtRisk
              ? "Nothing yet today — any real progress keeps your streak."
              : "Keep building your work history."}
      </p>
    </section>
  );
}
