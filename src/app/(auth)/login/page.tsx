import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { getOAuthProviderStatus } from "@/lib/auth/oauth-providers";

export default async function LoginPage() {
  const providers = await getOAuthProviderStatus();

  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      }
    >
      <LoginForm providers={providers} />
    </Suspense>
  );
}
