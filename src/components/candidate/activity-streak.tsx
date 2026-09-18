type ActivityStreakProps = { activityDates: string[] };

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function ActivityStreak({ activityDates }: ActivityStreakProps) {
  const active = new Set(activityDates.map((date) => date.slice(0, 10)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today);
  while (active.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const days = Array.from({ length: 91 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (90 - index));
    return date;
  });
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-ink-900">Trialent consistency</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real progress across your profile, applications, and paid work.
          </p>
        </div>
        <div className="text-right">
          <strong className="text-2xl text-emerald-600">{streak}</strong>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">day streak</p>
        </div>
      </div>
      <div className="mt-4 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((date) => {
          const key = isoDate(date);
          const isActive = active.has(key);
          return (
            <span
              key={key}
              title={`${key}${isActive ? ": active" : ""}`}
              className={`h-3 w-3 rounded-sm ${isActive ? "bg-emerald-500" : "bg-slate-100"}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>{active.size} active days in the last 13 weeks</span>
        <span>
          Less <i className="inline-block h-2.5 w-2.5 bg-slate-100 mx-1" />{" "}
          <i className="inline-block h-2.5 w-2.5 bg-emerald-500 mx-1" /> More
        </span>
      </div>
    </section>
  );
}
