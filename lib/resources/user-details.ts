import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, ApiError, type Paginated } from "@/lib/api-client";
import type { UserDetailsInput } from "@/lib/schemas/user-details";

export interface UserDetails {
  id: string;
  user_id: string;
  fullname: string;
  mobile_number: string | null;
  email: string | null;
}

function toPayload(userId: string, input: UserDetailsInput) {
  return {
    ud_user_id: userId,
    ud_fullname: input.fullname,
    ud_mobile_number: input.mobileNumber || null,
    ud_email: input.email || null,
  };
}

export function listUserDetails(page = 1): Promise<Paginated<UserDetails>> {
  return apiFetchPaginated<UserDetails>(`/admin/user-details?page=${page}`);
}

export function listAllUserDetails(): Promise<UserDetails[]> {
  return apiFetchAll<UserDetails>("/admin/user-details");
}

/**
 * The backend has no "get by user_id" endpoint — only lookup by its own
 * `ud_id`. We instead walk the (small, admin-managed) full list and match on
 * `user_id`, reusing apiFetchAll the same way reference-data dropdowns do.
 */
export async function getUserDetailsForUser(userId: string): Promise<UserDetails | null> {
  const all = await listAllUserDetails();
  return all.find((d) => d.user_id === userId) ?? null;
}

/**
 * UserDetailsController@update looks the record up by `ud_user_id` (not the
 * route's `ud_id`), and 404s if none exists yet. So "save" here means: try
 * update first, and only create if there's nothing to update — this avoids
 * needing to already know whether a record exists.
 */
export async function saveUserDetails(userId: string, input: UserDetailsInput): Promise<UserDetails> {
  try {
    return await apiFetch<UserDetails>(`/admin/user-details/${userId}`, {
      method: "PUT",
      body: JSON.stringify(toPayload(userId, input)),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return apiFetch<UserDetails>("/admin/user-details", {
        method: "POST",
        body: JSON.stringify(toPayload(userId, input)),
      });
    }
    throw err;
  }
}
