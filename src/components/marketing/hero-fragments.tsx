import { CheckCheck, GitCommitHorizontal, IndianRupee, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Decorative UI fragments scattered behind the hero. They deliberately bleed
 * past the container edges — content continuing past the frame is what reads as
 * depth. Every fragment shows something the product genuinely does, so the hero
 * doubles as a preview rather than abstract decoration.
 *
 * Hidden below lg: there is no room for them, and they must never intercept
 * clicks on the real call to action.
 */

function RaisedIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-2xl bg-white shadow-md ring-1 ring-line",
        className
      )}
    >
      {children}
    </div>
  );
}

export function HeroFragments() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none lg:block"
    >
      {/* Handwritten brief note, pinned and rotated */}
      <div className="absolute left-[-4rem] top-[6%] w-72 rotate-[-7deg]">
        <div className="relative rounded-sm bg-accent-200 p-fib6 shadow-lg">
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-rose-500 shadow" />
          <p className="font-hand text-[1.35rem] leading-snug text-ink-800">
            Write the brief once — requirements, deliverables, how you&rsquo;ll judge it.
          </p>
        </div>
      </div>

      <RaisedIcon className="absolute left-[3%] top-[40%] h-20 w-20 rotate-[6deg]">
        <CheckCheck className="h-9 w-9 text-brand-600" />
      </RaisedIcon>

      {/* Evaluation card, cropped by the right edge */}
      <div className="float-card absolute right-[-6rem] top-[7%] w-[22rem] rotate-[5deg] p-fib6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Evaluation
        </p>
        <p className="mt-fib2 font-semibold text-ink-900">Inventory API trial</p>
        <div className="mt-fib5 space-y-fib3 text-xs">
          {[
            ["Requirements met", "All"],
            ["Testing", "Exceeds"],
            ["Delivered on time", "Yes"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-ink-500">{label}</span>
              <span className="font-semibold text-ink-900">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-fib5 rounded-lg bg-brand-50 px-fib5 py-fib3 text-xs font-semibold text-brand-700">
          Would interview
        </div>
      </div>

      <RaisedIcon className="absolute right-[9%] top-[40%] h-16 w-16 rotate-[-8deg]">
        <Timer className="h-7 w-7 text-ink-700" />
      </RaisedIcon>

      {/* Commit trail, cropped by the bottom-left */}
      <div className="float-card absolute bottom-[5%] left-[1%] w-[21rem] rotate-[3deg] p-fib6">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          Work in progress
        </p>
        <div className="mt-fib5 space-y-fib5">
          {[
            ["Add schema migrations", "2h ago"],
            ["Auth middleware + tests", "yesterday"],
            ["Answered 2 clarifications", "3d ago"],
          ].map(([label, when]) => (
            <div key={label} className="flex items-start gap-fib4">
              <GitCommitHorizontal className="mt-fib1 h-4 w-4 shrink-0 text-brand-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800">{label}</p>
                <p className="text-xs text-ink-400">{when}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment card, cropped by the bottom-right */}
      <div className="float-card absolute bottom-[8%] right-[1%] w-[19rem] rotate-[-4deg] p-fib6">
        <div className="flex items-center gap-fib4">
          <RaisedIcon className="h-12 w-12 shadow-sm">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
          </RaisedIcon>
          <div>
            <p className="text-sm font-semibold text-ink-900">Candidate paid</p>
            <p className="text-xs text-ink-400">Guaranteed on completion</p>
          </div>
        </div>
        <p className="mt-fib5 text-2xl font-bold text-ink-900">₹5,000</p>
      </div>
    </div>
  );
}
