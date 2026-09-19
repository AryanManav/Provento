import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";
import { getOAuthProviderStatus } from "@/lib/auth/oauth-providers";

export default async function SignupPage() {
  const providers = await getOAuthProviderStatus();

  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-700" />
        </div>
      }
    >
      <SignupForm providers={providers} />
    </Suspense>
  );
}
