"use client";

import { useActionState, useState } from "react";
import {
  AlertTriangle,
  Eye,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  changePasswordAction,
  deleteAccountAction,
  signOutEverywhereAction,
  updateNameAction,
} from "@/lib/actions/account";
import { DELETE_ACCOUNT_PHRASE, PASSWORD_RULES } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBanner } from "@/components/common/status-banner";
import { DiscoverabilityToggle } from "@/components/account/discoverability-toggle";
import { cn } from "@/lib/utils";
import type { AccountSettingsView } from "@/lib/types/domain";
import type { UserRole } from "@/lib/types/database.types";
import type { LucideIcon } from "lucide-react";

function Section({
  icon: Icon,
  title,
  description,
  tone = "default",
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "grid gap-fib5 rounded-2xl border bg-white p-fib6 shadow-xs md:grid-cols-3",
        tone === "danger" ? "border-rose-200" : "border-line"
      )}
    >
      <div className="space-y-fib2">
        <h2
          className={cn(
            "flex items-center gap-fib3 font-bold",
            tone === "danger" ? "text-rose-700" : "text-ink-900"
          )}
        >
          <Icon className="h-4 w-4" />
          {title}
        </h2>
        <p className="text-sm text-ink-500">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </section>
  );
}

function NameForm({ fullName }: { fullName: string }) {
  const [state, action] = useActionState(updateNameAction, null);
  return (
    <form action={action} className="space-y-fib4">
      {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}
      {state?.success && <StatusBanner tone="success">Name saved.</StatusBanner>}
      <div className="space-y-fib3">
        <Label htmlFor="settings-name">Full name</Label>
        <Input
          id="settings-name"
          name="fullName"
          defaultValue={fullName}
          required
          minLength={2}
          maxLength={100}
        />
      </div>
      <div className="flex justify-end">
        <SubmitButton size="sm">Save name</SubmitButton>
      </div>
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState(changePasswordAction, null);
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="space-y-fib4">
      {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}
      {state?.success && (
        <StatusBanner tone="success">
          {hasPassword
            ? "Password changed."
            : "Password set — you can now sign in by email too."}
        </StatusBanner>
      )}
      <div className="grid gap-fib4 sm:grid-cols-2">
        <div className="space-y-fib3">
          <Label htmlFor="settings-password">New password</Label>
          <Input
            id="settings-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-fib3">
          <Label htmlFor="settings-confirm">Confirm password</Label>
          <Input
            id="settings-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
      </div>
      <ul className="space-y-fib1 text-xs">
        {PASSWORD_RULES.map((rule) => (
          <li
            key={rule.id}
            className={rule.test(password) ? "text-emerald-600" : "text-ink-400"}
          >
            {rule.test(password) ? "✓" : "•"} {rule.label}
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <SubmitButton size="sm">
          {hasPassword ? "Change password" : "Set password"}
        </SubmitButton>
      </div>
    </form>
  );
}

function SignOutEverywhere() {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-fib3"
        onClick={() => setConfirming(true)}
      >
        <LogOut className="h-4 w-4" />
        Sign out of all devices
      </Button>
    );
  }
  return (
    <form
      action={signOutEverywhereAction}
      className="flex flex-wrap items-center gap-fib4"
    >
      <span className="text-sm text-ink-600">
        This signs you out everywhere, including here.
      </span>
      <SubmitButton size="sm" variant="outline">
        Yes, sign out everywhere
      </SubmitButton>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm font-semibold text-ink-500 hover:text-ink-800"
      >
        Cancel
      </button>
    </form>
  );
}

const DELETION_EFFECTS: Record<Exclude<UserRole, "admin">, string[]> = {
  candidate: [
    "Your profile, skills, portfolio projects and photos",
    "Your applications, submissions, uploaded files' records and messages",
    "Your verified work history and the feedback startups gave you",
  ],
  company: [
    "Your personal account, name and sign-in methods",
    "Your membership of the company, and its logo if you uploaded it",
    "If you're the company's only member, its open projects are closed. Finished evaluations stay, so the candidates you evaluated keep their verified history.",
  ],
};

function DeleteAccount({ role, blockers }: { role: UserRole; blockers: string[] }) {
  const [state, action, pending] = useActionState(deleteAccountAction, null);
  const [confirmation, setConfirmation] = useState("");
  const effects = role === "admin" ? [] : DELETION_EFFECTS[role];
  const blocked = blockers.length > 0;

  return (
    <div className="space-y-fib5">
      <div className="space-y-fib3 text-sm text-ink-700">
        <p className="font-semibold">Deleting your account permanently removes:</p>
        <ul className="list-disc space-y-fib1 pl-fib6 text-ink-600">
          {effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
        <p className="text-ink-500">This can&apos;t be undone.</p>
      </div>

      {blocked ? (
        <div className="space-y-fib3 rounded-xl border border-amber-200 bg-amber-50 p-fib5 text-sm text-amber-900">
          <p className="flex items-center gap-fib3 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            You can&apos;t delete your account yet
          </p>
          <ul className="list-disc space-y-fib1 pl-fib6">
            {blockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : (
        <form action={action} className="space-y-fib4">
          {state?.error && <StatusBanner tone="error">{state.error}</StatusBanner>}
          <div className="space-y-fib3">
            <Label htmlFor="settings-delete">
              Type <span className="font-mono font-bold">{DELETE_ACCOUNT_PHRASE}</span> to
              confirm
            </Label>
            <Input
              id="settings-delete"
              name="confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="max-w-xs"
            />
          </div>
          <button
            type="submit"
            disabled={confirmation.trim() !== DELETE_ACCOUNT_PHRASE || pending}
            className="inline-flex items-center gap-fib3 rounded-full bg-rose-600 px-fib6 py-fib4 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete my account permanently
          </button>
        </form>
      )}
    </div>
  );
}

export function AccountSettings({
  fullName,
  email,
  role,
  settings,
}: {
  fullName: string;
  email: string;
  role: UserRole;
  settings: AccountSettingsView;
}) {
  return (
    <div className="space-y-fib6 pb-fib8">
      <div className="border-b border-line pb-fib6">
        <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
        <p className="mt-fib2 text-sm text-ink-500">
          Your account, how you sign in, and your data.
        </p>
      </div>

      <Section
        icon={UserRound}
        title="Account"
        description="The name shown on your applications, messages and profile."
      >
        <div className="space-y-fib5">
          <NameForm fullName={fullName} />
          <div className="flex items-center gap-fib3 border-t border-line pt-fib5 text-sm">
            <Mail className="h-4 w-4 text-ink-400" />
            <span className="text-ink-500">Email</span>
            <span className="font-semibold text-ink-900">{email}</span>
          </div>
          <p className="text-xs text-ink-400">
            Your email is your sign-in and can&apos;t be changed here.
          </p>
        </div>
      </Section>

      {settings.discoverable !== null && (
        <Section
          icon={Eye}
          title="Profile visibility"
          description="Choose whether you can be found in search."
        >
          <DiscoverabilityToggle
            initial={settings.discoverable}
            profileHref={settings.publicProfilePath}
          />
        </Section>
      )}

      <Section
        icon={ShieldCheck}
        title="Sign-in methods"
        description="Ways you can get into this account."
      >
        <div className="flex flex-wrap gap-fib3">
          {settings.signInMethods.length === 0 ? (
            <span className="text-sm text-ink-500">None found.</span>
          ) : (
            settings.signInMethods.map((method) => (
              <span
                key={method.provider}
                className="inline-flex items-center gap-fib2 rounded-full bg-emerald-50 px-fib5 py-fib2 text-xs font-semibold text-emerald-700"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {method.label}
              </span>
            ))
          )}
        </div>
        {role === "candidate" && (
          <p className="mt-fib4 text-xs text-ink-400">
            Connect GitHub from your profile to verify your repositories.
          </p>
        )}
      </Section>

      <Section
        icon={KeyRound}
        title={settings.hasPassword ? "Password" : "Set a password"}
        description={
          settings.hasPassword
            ? "Change the password you use with your email."
            : "You sign in with Google or GitHub. Add a password to also sign in by email."
        }
      >
        <PasswordForm hasPassword={settings.hasPassword} />
      </Section>

      <Section
        icon={LogOut}
        title="Sessions"
        description="Lost a device, or signed in on a shared computer?"
      >
        <SignOutEverywhere />
      </Section>

      <Section
        icon={Trash2}
        title="Delete account"
        description="Permanently remove your account and personal data."
        tone="danger"
      >
        <DeleteAccount role={role} blockers={settings.deletionBlockers} />
      </Section>
    </div>
  );
}
