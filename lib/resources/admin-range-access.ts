import "server-only";

import { apiFetch } from "@/lib/api-client";
import type { Range } from "@/lib/resources/ranges";

export function listRangesForAdmin(adminId: string): Promise<Range[]> {
  return apiFetch<Range[]>(`/admin/admin-range-access?admin_id=${adminId}`);
}

export function grantAdminRangeAccess(adminId: string, rangeId: string): Promise<void> {
  return apiFetch<void>("/admin/admin-range-access", {
    method: "POST",
    body: JSON.stringify({ admin_id: adminId, range_id: rangeId }),
  });
}

export function revokeAdminRangeAccess(adminId: string, rangeId: string): Promise<void> {
  return apiFetch<void>(`/admin/admin-range-access/${adminId}/${rangeId}`, { method: "DELETE" });
}
