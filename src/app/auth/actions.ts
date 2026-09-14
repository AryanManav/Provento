"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations";
import { UserRole } from "@/lib/types/database.types";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || null;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (error || !data.user) {
    return { error: error?.message || "Invalid email or password" };
  }

  // Determine user destination based on role
  let role: UserRole = "candidate";
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (dbUser?.role) {
    role = dbUser.role as UserRole;
  } else if (data.user.user_metadata?.role) {
    role = data.user.user_metadata.role as UserRole;
  }

  if (redirectTo && !redirectTo.startsWith("/login") && !redirectTo.startsWith("/signup")) {
    redirect(redirectTo);
  }

  if (role === "admin") {
    redirect("/admin");
  } else if (role === "company") {
    redirect("/company/dashboard");
  } else {
    redirect("/candidate/dashboard");
  }
}

export async function signupAction(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "candidate" | "company";

  const validated = signupSchema.safeParse({ fullName, email, password, role });
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        full_name: validated.data.fullName,
        role: validated.data.role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Failed to create account. Please try again." };
  }

  if (role === "company") {
    redirect("/company/dashboard");
  } else {
    redirect("/candidate/dashboard");
  }
}
