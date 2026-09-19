import { Flame } from "lucide-react";
import { buildActivityCalendar, type ActivityLevel } from "@/lib/activity";
import { cn } from "@/lib/utils";

type ActivityStreakProps = { activityDates: string[] };

const LEVEL_CLASS: Record<ActivityLevel, string> = {
  0: "bg-ink-100",
  1: "bg-money-200",
  2: "bg-money-400",
  3: "bg-money-600",
};

const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

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

export function ActivityStreak({ activityDates }: ActivityStreakProps) {
  const calendar = buildActivityCalendar(activityDates);
  const { streak, streakAtRisk, longestStreak, activeDays } = calendar;

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-ink-900">Trialent consistency</h2>
          <p className="mt-1 text-xs text-ink-500">
            Real progress across your profile, applications, and paid work.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <strong
            className={cn(
              "inline-flex items-center gap-1 text-2xl",
              streak > 0 ? "text-money-600" : "text-ink-400"
            )}
          >
            {streak > 0 && <Flame className="h-5 w-5" aria-hidden />}
            {streak}
          </strong>
          <p className="text-[10px] uppercase tracking-wide text-ink-500">day streak</p>
        </div>
      </div>

      <div
        role="img"
        aria-label={`${activeDays} active day${activeDays === 1 ? "" : "s"} in the last ${calendar.weeks.length} weeks, current streak ${streak}`}
        className="mt-4 grid grid-flow-col grid-rows-[auto_repeat(7,minmax(0,1fr))] gap-[3px] text-[9px] leading-none text-ink-400"
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

      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-ink-500">
        <span>
          {activeDays} active day{activeDays === 1 ? "" : "s"} · best streak{" "}
          {longestStreak}
        </span>
        <span className="flex items-center gap-[3px]" aria-hidden>
          Less
          {([0, 1, 2, 3] as const).map((level) => (
            <i
              key={level}
              className={cn("inline-block h-2.5 w-2.5 rounded-[2px]", LEVEL_CLASS[level])}
            />
          ))}
          More
        </span>
      </div>

      <p className="mt-2 text-[11px] text-ink-500">
        {streak === 0
          ? "Update your profile, apply, or post progress on a project to start a streak."
          : streakAtRisk
            ? "Make progress today to keep your streak going."
            : "You've made progress today. Come back tomorrow to keep it going."}
      </p>
    </section>
  );
}
