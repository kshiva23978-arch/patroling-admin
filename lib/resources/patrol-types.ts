import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { PatrolTypeInput } from "@/lib/schemas/patrol-types";

export interface PatrolType {
  id: string;
  name: string;
  description: string | null;
  status: boolean;
  categories: string[];
  created_at: string | null;
  updated_at: string | null;
}

function toPayload(input: PatrolTypeInput) {
  return {
    pt_name: input.name,
    pt_description: input.description || null,
    pt_status: input.status,
    categories: input.categories,
  };
}

export function listPatrolTypes(page = 1): Promise<Paginated<PatrolType>> {
  return apiFetchPaginated<PatrolType>(`/admin/patrol-types?page=${page}`);
}

export function listAllPatrolTypes(): Promise<PatrolType[]> {
  return apiFetchAll<PatrolType>("/admin/patrol-types");
}

export function getPatrolType(id: string): Promise<PatrolType> {
  return apiFetch<PatrolType>(`/admin/patrol-types/${id}`);
}

export function createPatrolType(input: PatrolTypeInput): Promise<PatrolType> {
  return apiFetch<PatrolType>("/admin/patrol-types", { method: "POST", body: JSON.stringify(toPayload(input)) });
}

export function updatePatrolType(id: string, input: PatrolTypeInput): Promise<PatrolType> {
  return apiFetch<PatrolType>(`/admin/patrol-types/${id}`, { method: "PUT", body: JSON.stringify(toPayload(input)) });
}

export function deletePatrolType(id: string): Promise<void> {
  return apiFetch<void>(`/admin/patrol-types/${id}`, { method: "DELETE" });
}
