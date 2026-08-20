import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { BeatCreateInput, BeatUpdateInput } from "@/lib/schemas/beats";

export interface Beat {
  id: string;
  range_id: string;
  name: string;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function listBeats(page = 1, rangeId?: string): Promise<Paginated<Beat>> {
  const params = new URLSearchParams({ page: String(page) });
  if (rangeId) params.set("range_id", rangeId);
  return apiFetchPaginated<Beat>(`/admin/beats?${params.toString()}`);
}

export function getBeat(id: string): Promise<Beat> {
  return apiFetch<Beat>(`/admin/beats/${id}`);
}

export function createBeat(input: BeatCreateInput): Promise<Beat> {
  return apiFetch<Beat>("/admin/beats", {
    method: "POST",
    body: JSON.stringify({ bt_range_id: input.rangeId, bt_name: input.name, bt_status: input.status }),
  });
}

export function updateBeat(id: string, input: BeatUpdateInput): Promise<Beat> {
  return apiFetch<Beat>(`/admin/beats/${id}`, {
    method: "PUT",
    body: JSON.stringify({ bt_name: input.name, bt_status: input.status }),
  });
}

export function deleteBeat(id: string): Promise<void> {
  return apiFetch<void>(`/admin/beats/${id}`, { method: "DELETE" });
}
