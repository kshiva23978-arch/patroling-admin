import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { VehicleCreateInput, VehicleUpdateInput } from "@/lib/schemas/vehicles";

export interface Vehicle {
  id: string;
  range_id: string;
  registration_number: string;
  type: "vehicle" | "boat";
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function listVehicles(page = 1, rangeId?: string): Promise<Paginated<Vehicle>> {
  const params = new URLSearchParams({ page: String(page) });
  if (rangeId) params.set("range_id", rangeId);
  return apiFetchPaginated<Vehicle>(`/admin/vehicles?${params.toString()}`);
}

export function getVehicle(id: string): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/admin/vehicles/${id}`);
}

export function createVehicle(input: VehicleCreateInput): Promise<Vehicle> {
  return apiFetch<Vehicle>("/admin/vehicles", {
    method: "POST",
    body: JSON.stringify({
      vh_range_id: input.rangeId,
      vh_registration_number: input.registrationNumber,
      vh_type: input.type,
      vh_status: input.status,
    }),
  });
}

export function updateVehicle(id: string, input: VehicleUpdateInput): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/admin/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      vh_registration_number: input.registrationNumber,
      vh_type: input.type,
      vh_status: input.status,
    }),
  });
}

export function deleteVehicle(id: string): Promise<void> {
  return apiFetch<void>(`/admin/vehicles/${id}`, { method: "DELETE" });
}
