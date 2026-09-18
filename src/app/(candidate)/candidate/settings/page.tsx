import { requireCandidate } from "@/lib/auth/guards";
import { getAccountSettings } from "@/lib/data/account";
import { AccountSettings } from "@/components/account/account-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireCandidate();
  const settings = await getAccountSettings();
  return (
    <AccountSettings
      fullName={user.fullName}
      email={user.email}
      role={user.role}
      settings={settings}
    />
  );
}
