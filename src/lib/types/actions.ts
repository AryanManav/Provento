/**
 * Shared server-action result shape.
 *
 * Kept out of the `"use server"` modules because those files may only export
 * async functions.
 */
export type ActionResponse = {
  success?: boolean;
  error?: string;
};

export type AuthState = ActionResponse;
