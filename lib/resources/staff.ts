import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { StaffCreateInput, StaffUpdateInput } from "@/lib/schemas/staff";

export interface Staff {
  id: string;
  name: string;
  designation_id: string | null;
  range_id: string;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function listStaff(page = 1, rangeId?: string): Promise<Paginated<Staff>> {
  const params = new URLSearchParams({ page: String(page) });
  if (rangeId) params.set("range_id", rangeId);
  return apiFetchPaginated<Staff>(`/admin/staff?${params.toString()}`);
}

export function getStaff(id: string): Promise<Staff> {
  return apiFetch<Staff>(`/admin/staff/${id}`);
}

export function createStaff(input: StaffCreateInput): Promise<Staff> {
  return apiFetch<Staff>("/admin/staff", {
    method: "POST",
    body: JSON.stringify({
      st_name: input.name,
      st_designation_id: input.designationId || null,
      st_range_id: input.rangeId,
      st_status: input.status,
    }),
  });
}

export function updateStaff(id: string, input: StaffUpdateInput): Promise<Staff> {
  return apiFetch<Staff>(`/admin/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      st_name: input.name,
      st_designation_id: input.designationId || null,
      st_range_id: input.rangeId,
      st_status: input.status,
    }),
  });
}

export function deleteStaff(id: string): Promise<void> {
  return apiFetch<void>(`/admin/staff/${id}`, { method: "DELETE" });
}
