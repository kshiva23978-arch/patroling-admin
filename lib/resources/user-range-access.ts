import "server-only";

import { apiFetch } from "@/lib/api-client";
import type { Range } from "@/lib/resources/ranges";

export function listRangesForUser(userId: string): Promise<Range[]> {
  return apiFetch<Range[]>(`/admin/user-range-access?user_id=${userId}`);
}

export function grantRangeAccess(userId: string, rangeId: string): Promise<void> {
  return apiFetch<void>("/admin/user-range-access", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, range_id: rangeId }),
  });
}

export function revokeRangeAccess(userId: string, rangeId: string): Promise<void> {
  return apiFetch<void>(`/admin/user-range-access/${userId}/${rangeId}`, { method: "DELETE" });
}
