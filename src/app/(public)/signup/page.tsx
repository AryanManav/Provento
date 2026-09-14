"use client";

import { useActionState, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Briefcase, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, null);
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "company" ? "company" : "candidate";
  const [selectedRole, setSelectedRole] = useState<"candidate" | "company">(initialRole);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "company" || roleParam === "candidate") {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="h-10 w-10 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg mb-2">
          P
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Create your account</CardTitle>
        <CardDescription>Join Provento to evaluate or prove engineering ability</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="role" value={selectedRole} />

          {state?.error && (
            <div className="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {state.error}
            </div>
          )}

          {/* Role Selection Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              I am joining as:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("candidate")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all",
                  selectedRole === "candidate"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <GraduationCap className={cn("h-5 w-5 mb-1", selectedRole === "candidate" ? "text-indigo-600" : "text-slate-400")} />
                <span>Candidate</span>
                <span className="text-[11px] text-slate-500 font-normal">Junior Developer</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("company")}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all",
                  selectedRole === "company"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                <Briefcase className={cn("h-5 w-5 mb-1", selectedRole === "company" ? "text-indigo-600" : "text-slate-400")} />
                <span>Startup</span>
                <span className="text-[11px] text-slate-500 font-normal">Hiring Manager</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="fullName">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder={selectedRole === "candidate" ? "Arjun Sharma" : "Priya Mehta"}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={selectedRole === "candidate" ? "arjun@example.com" : "priya@startup.com"}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
        <div>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
