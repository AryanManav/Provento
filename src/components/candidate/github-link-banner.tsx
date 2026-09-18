import { StatusBanner } from "@/components/common/status-banner";

/** Result of the GitHub OAuth round trip, carried back as ?github=linked|failed. */
export function GithubLinkBanner({ status }: { status?: string }) {
  if (status === "linked") {
    return (
      <StatusBanner tone="success">
        GitHub verified. Your account is now linked to your profile.
      </StatusBanner>
    );
  }
  if (status === "failed") {
    return (
      <StatusBanner tone="error">
        GitHub couldn&rsquo;t be linked. Verification may not be available yet — your
        profile link still works in the meantime.
      </StatusBanner>
    );
  }
  return null;
}
