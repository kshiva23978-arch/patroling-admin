import { ApiError } from "./api-client";

export type ActionResult =
  | { success: true }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

export function toActionResult(err: unknown): ActionResult {
  if (err instanceof ApiError) {
    return { success: false, message: err.message, fieldErrors: err.fieldErrors };
  }
  return { success: false, message: "Something went wrong. Please try again." };
}
