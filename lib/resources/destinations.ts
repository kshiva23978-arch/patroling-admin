import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { DestinationInput } from "@/lib/schemas/destinations";

export interface Destination {
  id: string;
  name: string;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function listDestinations(page = 1): Promise<Paginated<Destination>> {
  return apiFetchPaginated<Destination>(`/admin/destinations?page=${page}`);
}

/** Every destination in one round-trip — see `DestinationsController::listAll`. */
export function listAllDestinations(): Promise<Destination[]> {
  return apiFetch<Destination[]>("/admin/destinations/all");
}

export function getDestination(id: string): Promise<Destination> {
  return apiFetch<Destination>(`/admin/destinations/${id}`);
}

export function createDestination(input: DestinationInput): Promise<Destination> {
  return apiFetch<Destination>("/admin/destinations", { method: "POST", body: JSON.stringify(input) });
}

export function updateDestination(id: string, input: DestinationInput): Promise<Destination> {
  return apiFetch<Destination>(`/admin/destinations/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteDestination(id: string): Promise<void> {
  return apiFetch<void>(`/admin/destinations/${id}`, { method: "DELETE" });
}
