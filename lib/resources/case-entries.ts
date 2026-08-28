import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";

export type CaseStatus = "pending" | "in_progress" | "completed";

export interface CaseEntry {
  id: string;
  case_number: string;
  status: CaseStatus;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  range: { id: string; name: string } | null;
  beat: { id: string; name: string } | null;
  area_covered: string | null;
  case_type: string | null;
  leader: { id: string; employee_id: string | null; name: string | null } | null;
}

export function listCaseEntries(page = 1, status?: CaseStatus, rangeId?: string): Promise<Paginated<CaseEntry>> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (rangeId) params.set("range_id", rangeId);
  return apiFetchPaginated<CaseEntry>(`/admin/case-entries?${params.toString()}`);
}

export function getCaseEntry(id: string): Promise<CaseEntry> {
  return apiFetch<CaseEntry>(`/admin/case-entries/${id}`);
}
