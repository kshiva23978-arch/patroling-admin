import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";

export type CaseStatus = "pending" | "in_progress" | "completed";

export interface CaseLocation {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface CaseMediaRef {
  id: string;
}

export interface CaseVehicleRef {
  id: string;
  type: string;
  registration_no: string | null;
  is_current: boolean;
  start_odometer: number | null;
  end_odometer: number | null;
  distance: number | null;
}

export interface CaseIncidentRef {
  id: string;
  name: string;
  details: string;
  status: string;
  location: CaseLocation;
  photos: CaseMediaRef[];
  photo_count: number;
  reported_at: string | null;
}

export interface CaseFilingRef {
  id: string;
  filing_number: string;
  details: string;
  status: string;
  conflict_type: string | null;
  rescue_conducted: boolean | null;
  species_rescued: string | null;
  rehab_details: string | null;
  response_time: string | null;
  location: CaseLocation;
  photos: CaseMediaRef[];
  photo_count: number;
  reported_at: string | null;
}

export interface CaseNoteRef {
  id: string;
  text: string;
  created_at: string | null;
}

export interface CaseLeaderRef {
  id: string;
  employee_id: string | null;
  name: string | null;
}

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
  modes: { id: string; name: string }[];
  vehicles: CaseVehicleRef[];
  staff_names: string[];
  incharge_staff: string | null;
  staff_deployed_count: number;
  start_location: CaseLocation;
  end_location: CaseLocation;
  total_distance: number | null;
  incident_occurred: boolean;
  case_filed: boolean;
  report: string | null;
  incidents: CaseIncidentRef[];
  filings: CaseFilingRef[];
  notes: CaseNoteRef[];
  closing_photos: CaseMediaRef[];
  closing_photo_count: number;
  current_travel_mode: "walking" | "vehicle" | null;
  current_vehicle_id: string | null;
  leader: CaseLeaderRef | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CaseRoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  travel_mode: "walking" | "vehicle" | null;
  vehicle_type: string | null;
  recorded_at: string;
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

/**
 * Deletes a case outright — its incidents, filings, route history, notes,
 * and photos all go with it (see backend `AdminCaseEntryController::destroy`).
 */
export function deleteCaseEntry(id: string): Promise<void> {
  return apiFetch<void>(`/admin/case-entries/${id}`, { method: "DELETE" });
}

/**
 * The case's GPS trail, oldest first. Pass `since` (an ISO timestamp,
 * typically the last point already held client-side) to fetch only newer
 * points instead of the whole trail — what the live-tracking map polls.
 */
export async function listCaseRoutePoints(id: string, since?: string): Promise<CaseRoutePoint[]> {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  const query = params.toString();
  return apiFetch<CaseRoutePoint[]>(`/admin/case-entries/${id}/route-points${query ? `?${query}` : ""}`);
}
