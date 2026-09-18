import { z } from "zod";
import { strongPassword } from "./auth";

export const updateNameSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
});

export const changePasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The two passwords don't match",
    path: ["confirmPassword"],
  });

/** Typed by hand, so a stray click can never delete an account. */
export const DELETE_ACCOUNT_PHRASE = "DELETE";

export const deleteAccountSchema = z.object({
  confirmation: z.literal(DELETE_ACCOUNT_PHRASE, {
    errorMap: () => ({ message: `Type ${DELETE_ACCOUNT_PHRASE} to confirm` }),
  }),
});
