import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { DesignationInput } from "@/lib/schemas/designations";

export interface Designation {
  id: string;
  designation_name: string;
  rank_order: number;
  description: string | null;
  status: boolean;
}

function toPayload(input: DesignationInput) {
  return {
    d_designation_name: input.name,
    d_rank_order: input.rankOrder,
    d_description: input.description || null,
    d_status: input.status,
  };
}

export function listDesignations(page = 1): Promise<Paginated<Designation>> {
  return apiFetchPaginated<Designation>(`/admin/designations?page=${page}`);
}

export function listAllDesignations(): Promise<Designation[]> {
  return apiFetchAll<Designation>("/admin/designations");
}

export function getDesignation(id: string): Promise<Designation> {
  return apiFetch<Designation>(`/admin/designations/${id}`);
}

export function createDesignation(input: DesignationInput): Promise<Designation> {
  return apiFetch<Designation>("/admin/designations", { method: "POST", body: JSON.stringify(toPayload(input)) });
}

export function updateDesignation(id: string, input: DesignationInput): Promise<Designation> {
  // DesignationsController@update ignores the route param and looks the record
  // up by `d_id` in the request body — it must be included here or the update
  // silently fails validation.
  return apiFetch<Designation>(`/admin/designations/${id}`, {
    method: "PUT",
    body: JSON.stringify({ d_id: id, ...toPayload(input) }),
  });
}

export function deleteDesignation(id: string): Promise<void> {
  return apiFetch<void>(`/admin/designations/${id}`, { method: "DELETE" });
}
