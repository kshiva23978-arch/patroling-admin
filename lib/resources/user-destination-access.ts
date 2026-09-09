import "server-only";

import { apiFetch } from "@/lib/api-client";
import type { Destination } from "@/lib/resources/destinations";

export function listDestinationsForUser(userId: string): Promise<Destination[]> {
  return apiFetch<Destination[]>(`/admin/user-destination-access?user_id=${userId}`);
}

export function grantDestinationAccess(userId: string, destinationId: string): Promise<void> {
  return apiFetch<void>("/admin/user-destination-access", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, destination_id: destinationId }),
  });
}

export function revokeDestinationAccess(userId: string, destinationId: string): Promise<void> {
  return apiFetch<void>(`/admin/user-destination-access/${userId}/${destinationId}`, { method: "DELETE" });
}
