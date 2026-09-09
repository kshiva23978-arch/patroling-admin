import "server-only";

import { apiFetch } from "@/lib/api-client";
import type { Destination } from "@/lib/resources/destinations";

export function listDestinationsForAdmin(adminId: string): Promise<Destination[]> {
  return apiFetch<Destination[]>(`/admin/admin-destination-access?admin_id=${adminId}`);
}

export function grantAdminDestinationAccess(adminId: string, destinationId: string): Promise<void> {
  return apiFetch<void>("/admin/admin-destination-access", {
    method: "POST",
    body: JSON.stringify({ admin_id: adminId, destination_id: destinationId }),
  });
}

export function revokeAdminDestinationAccess(adminId: string, destinationId: string): Promise<void> {
  return apiFetch<void>(`/admin/admin-destination-access/${adminId}/${destinationId}`, { method: "DELETE" });
}
