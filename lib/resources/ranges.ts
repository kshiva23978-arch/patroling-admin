import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { RangeInput } from "@/lib/schemas/ranges";

export interface Range {
  id: string;
  range_id: string;
  range_name: string;
  category: string | null;
  range_headquarter: string;
  key_activities: string | null;
  patrolling_modes: { id: string; mode_name: string }[];
  created_at: string | null;
  updated_at: string | null;
}

function toPayload(input: RangeInput) {
  return {
    rn_range_id: input.rangeId,
    rn_range_name: input.rangeName,
    rn_category: input.category || null,
    rn_range_headquarter: input.rangeHeadquarter,
    rn_key_activities: input.keyActivities || null,
    patrolling_mode_ids: input.patrollingModeIds,
  };
}

export function listRanges(page = 1): Promise<Paginated<Range>> {
  return apiFetchPaginated<Range>(`/admin/ranges?page=${page}`);
}

export function listAllRanges(): Promise<Range[]> {
  return apiFetchAll<Range>("/admin/ranges");
}

export function getRange(id: string): Promise<Range> {
  return apiFetch<Range>(`/admin/ranges/${id}`);
}

export function createRange(input: RangeInput): Promise<Range> {
  return apiFetch<Range>("/admin/ranges", { method: "POST", body: JSON.stringify(toPayload(input)) });
}

export function updateRange(id: string, input: RangeInput): Promise<Range> {
  return apiFetch<Range>(`/admin/ranges/${id}`, { method: "PUT", body: JSON.stringify(toPayload(input)) });
}

export function deleteRange(id: string): Promise<void> {
  return apiFetch<void>(`/admin/ranges/${id}`, { method: "DELETE" });
}
