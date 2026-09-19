import { StreakCard } from "@/components/profile/activity";

/** The dashboard's streak: the owner's view of the profile's StreakCard. */
export function ActivityStreak({ activityDates }: { activityDates: string[] }) {
  return <StreakCard activityDates={activityDates} viewer="owner" />;
}
