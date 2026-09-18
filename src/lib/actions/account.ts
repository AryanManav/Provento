"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateNameSchema,
} from "@/lib/validations";
import { PROFILE_MEDIA_BUCKET } from "@/lib/constants";
import type { ActionResponse } from "@/lib/types/actions";

export async function updateNameAction(
  _prev: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireAuth();
  const parsed = updateNameSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (error) return { error: "Couldn't save your name. Please try again." };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function changePasswordAction(
  _prev: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  await requireAuth();
  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      error: /reauth|recent/i.test(error.message)
        ? "For security, sign out and sign back in, then change your password."
        : /same/i.test(error.message)
          ? "That's already your password."
          : "Couldn't change your password. Please try again.",
    };
  }
  return { success: true };
}

/** Ends every session on every device, including this one. */
export async function signOutEverywhereAction(): Promise<void> {
  await requireAuth();
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}

export async function deleteAccountAction(
  _prev: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const user = await requireAuth();
  const parsed = deleteAccountSchema.safeParse({
    confirmation: String(formData.get("confirmation") ?? "").trim(),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();

  // The database refuses while a candidate is mid-project; ask first so the
  // user's images aren't removed for an account that then can't be deleted.
  const { data: blockers } = await supabase.rpc("account_deletion_blockers");
  if (Array.isArray(blockers) && blockers.length > 0) return { error: blockers[0] };

  // Profile photo, banner and logo live in the user's own folder.
  const bucket = supabase.storage.from(PROFILE_MEDIA_BUCKET);
  const { data: files } = await bucket.list(user.id);
  if (files?.length) {
    await bucket.remove(files.map((file) => `${user.id}/${file.name}`));
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return {
      error:
        error.code === "P0001"
          ? error.message
          : "Couldn't delete your account. Please try again.",
    };
  }

  // The auth user is gone; clear this browser's session cookies too.
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
