import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { PatrollingModeInput } from "@/lib/schemas/patrolling-modes";

export interface PatrollingMode {
  id: string;
  mode_name: string;
  created_at: string | null;
  updated_at: string | null;
}

function toPayload(input: PatrollingModeInput) {
  return { pm_mode_name: input.name };
}

export function listPatrollingModes(page = 1): Promise<Paginated<PatrollingMode>> {
  return apiFetchPaginated<PatrollingMode>(`/admin/patrolling-modes?page=${page}`);
}

export function listAllPatrollingModes(): Promise<PatrollingMode[]> {
  return apiFetchAll<PatrollingMode>("/admin/patrolling-modes");
}

export function getPatrollingMode(id: string): Promise<PatrollingMode> {
  return apiFetch<PatrollingMode>(`/admin/patrolling-modes/${id}`);
}

export function createPatrollingMode(input: PatrollingModeInput): Promise<PatrollingMode> {
  return apiFetch<PatrollingMode>("/admin/patrolling-modes", { method: "POST", body: JSON.stringify(toPayload(input)) });
}

export function updatePatrollingMode(id: string, input: PatrollingModeInput): Promise<PatrollingMode> {
  return apiFetch<PatrollingMode>(`/admin/patrolling-modes/${id}`, { method: "PUT", body: JSON.stringify(toPayload(input)) });
}

export function deletePatrollingMode(id: string): Promise<void> {
  return apiFetch<void>(`/admin/patrolling-modes/${id}`, { method: "DELETE" });
}
