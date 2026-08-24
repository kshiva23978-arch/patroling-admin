import "server-only";

import { apiFetch } from "@/lib/api-client";

export interface DashboardStats {
  ranges: number;
  beats: number;
  patrollings: number;
  live_patrollings: number;
  cases: number;
  incidents: number;
}

/** Talks to `GET /admin/dashboard/stats` — optionally scoped to a range and/or a patrol-date range. */
export function getDashboardStats(params: {
  rangeId?: string;
  from?: string;
  to?: string;
}): Promise<DashboardStats> {
  const query = new URLSearchParams();
  if (params.rangeId) query.set("range_id", params.rangeId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const qs = query.toString();
  return apiFetch<DashboardStats>(`/admin/dashboard/stats${qs ? `?${qs}` : ""}`);
}
