import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { BeachCreateInput, BeachUpdateInput } from "@/lib/schemas/beaches";

export interface Beach {
  id: string;
  destination_id: string;
  shared_destination_id: string | null;
  name: string;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function listBeaches(page = 1, destinationId?: string, search?: string): Promise<Paginated<Beach>> {
  const params = new URLSearchParams({ page: String(page) });
  if (destinationId) params.set("destination_id", destinationId);
  if (search) params.set("search", search);
  return apiFetchPaginated<Beach>(`/admin/beaches?${params.toString()}`);
}

/** Every beach (optionally narrowed to one destination), one round-trip — see `BeachesController::listAll`. */
export function listAllBeaches(destinationId?: string): Promise<Beach[]> {
  const params = new URLSearchParams();
  if (destinationId) params.set("destination_id", destinationId);
  const query = params.toString();
  return apiFetch<Beach[]>(`/admin/beaches/all${query ? `?${query}` : ""}`);
}

export function getBeach(id: string): Promise<Beach> {
  return apiFetch<Beach>(`/admin/beaches/${id}`);
}

export function createBeach(input: BeachCreateInput): Promise<Beach> {
  return apiFetch<Beach>("/admin/beaches", {
    method: "POST",
    body: JSON.stringify({
      destination_id: input.destinationId,
      shared_destination_id: input.sharedDestinationId || null,
      name: input.name,
      status: input.status,
    }),
  });
}

export function updateBeach(id: string, input: BeachUpdateInput): Promise<Beach> {
  return apiFetch<Beach>(`/admin/beaches/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      destination_id: input.destinationId,
      shared_destination_id: input.sharedDestinationId || null,
      name: input.name,
      status: input.status,
    }),
  });
}

export function deleteBeach(id: string): Promise<void> {
  return apiFetch<void>(`/admin/beaches/${id}`, { method: "DELETE" });
}
