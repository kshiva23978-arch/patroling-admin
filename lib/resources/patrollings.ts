import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";

export type PatrolStatus = "pending" | "in_progress" | "completed";

export interface PatrolRefShape {
  id: string;
  name: string;
}

export interface PatrolLeaderRef {
  id: string;
  employee_id: string;
  name: string | null;
}

export interface PatrolVehicleRef {
  id: string;
  type: string;
  registration_no: string | null;
  is_current: boolean;
  start_odometer: number | null;
  end_odometer: number | null;
  /** Odometer-based distance (end - start) for this vehicle, in km. */
  distance: number | null;
}

export interface PatrolMediaRef {
  id: string;
}

export interface PatrolLocation {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface PatrolCaseRef {
  id: string;
  case_number: string;
  details: string;
  conflict_type: string | null;
  rescue_conducted: boolean | null;
  species_rescued: string | null;
  rehab_details: string | null;
  response_time: string | null;
  location: PatrolLocation;
  photos: PatrolMediaRef[];
  reported_at: string | null;
}

export interface PatrolIncidentRef {
  id: string;
  name: string;
  details: string;
  location: PatrolLocation;
  photos: PatrolMediaRef[];
  reported_at: string | null;
}

/** One filled-in custom field answer — see RangeCustomFieldController/PatrolEntryCustomFieldValue. */
export interface PatrolCustomFieldValueRef {
  custom_field_id: string;
  field_name: string | null;
  input_type: "text" | "boolean" | "dropdown" | "time" | "date" | "number" | null;
  value: string | null;
}

/** Shape returned by `/admin/patrol-entries` — see AdminPatrolEntryResource. */
export interface Patrolling {
  id: string;
  patrol_id: string;
  status: PatrolStatus;
  date: string;
  start_time: string;
  end_time: string | null;
  range: PatrolRefShape | null;
  beat: PatrolRefShape | null;
  patrol_type: PatrolRefShape | null;
  patrol_leader: PatrolLeaderRef | null;
  modes: PatrolRefShape[];
  vehicles: PatrolVehicleRef[];
  area_covered: string | null;
  area_patrolled: string | null;
  remarks: string | null;
  staff_deployed_count: number;
  staff_names: string[];
  incharge_staff: string | null;
  current_travel_mode: "walking" | "vehicle" | null;
  current_vehicle_id: string | null;
  start_location: PatrolLocation;
  end_location: PatrolLocation;
  total_distance: number | null;
  incident_occurred: boolean;
  case_registered: boolean;
  case_reports: PatrolCaseRef[];
  incidents: PatrolIncidentRef[];
  custom_field_values: PatrolCustomFieldValueRef[];
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
}

/** One GPS point on a patrol's route trail — see PatrolRoutePointResource. */
export interface PatrolRoutePoint {
  id: string;
  latitude: number;
  longitude: number;
  travel_mode: "walking" | "vehicle" | null;
  // Backend allows "2_wheeler" too (not just "4_wheeler"/"boat") — kept as
  // `string` rather than a narrower literal union so this type also covers
  // `CaseRoutePoint` (Case module vehicles) passed into the shared `LiveMap`.
  vehicle_type: string | null;
  recorded_at: string;
}

/**
 * Postgres decimal columns come back from the Laravel API as JSON strings
 * (e.g. `"11.6767400"`), not numbers — coerce them so callers (esp. the
 * map components) always get real numbers.
 */
function toNumber(value: unknown): number {
  return typeof value === "number" ? value : parseFloat(String(value));
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = toNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeLocation(location: PatrolLocation): PatrolLocation {
  return {
    latitude: toNumberOrNull(location.latitude),
    longitude: toNumberOrNull(location.longitude),
    address: location.address,
  };
}

function normalizePatrolling(entry: Patrolling): Patrolling {
  return {
    ...entry,
    start_location: normalizeLocation(entry.start_location),
    end_location: normalizeLocation(entry.end_location),
    total_distance: toNumberOrNull(entry.total_distance),
    vehicles: entry.vehicles.map((v) => ({
      ...v,
      start_odometer: toNumberOrNull(v.start_odometer),
      end_odometer: toNumberOrNull(v.end_odometer),
      distance: toNumberOrNull(v.distance),
    })),
    case_reports: entry.case_reports.map((c) => ({ ...c, location: normalizeLocation(c.location) })),
    incidents: entry.incidents.map((i) => ({ ...i, location: normalizeLocation(i.location) })),
  };
}

function normalizeRoutePoint(point: PatrolRoutePoint): PatrolRoutePoint {
  return {
    ...point,
    latitude: toNumber(point.latitude),
    longitude: toNumber(point.longitude),
  };
}

export type ActivityType = "patrolling" | "case";

/**
 * One flattened row from `/admin/patrol-entries?type=case|all` — a patrol
 * entry or a case report, tagged by `type`. `entry_id` is the owning patrol
 * entry either way, so every row links to the same `/patrollings/{entry_id}`
 * detail page (a case's own detail lives inside its patrol's page).
 */
export interface ActivityRow {
  id: string;
  type: ActivityType;
  entry_id: string;
  reference: string;
  status: string;
  range_name: string | null;
  beat_name: string | null;
  leader_employee_id: string | null;
  leader_name: string | null;
  date: string | null;
}

export async function listActivity(
  page = 1,
  type: "case" | "all",
  status?: PatrolStatus,
  rangeId?: string,
): Promise<Paginated<ActivityRow>> {
  const params = new URLSearchParams({ page: String(page), type });
  if (status) params.set("status", status);
  if (rangeId) params.set("range_id", rangeId);
  return apiFetchPaginated<ActivityRow>(`/admin/patrol-entries?${params.toString()}`);
}

export async function listPatrollings(
  page = 1,
  status?: PatrolStatus,
  rangeId?: string,
): Promise<Paginated<Patrolling>> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (rangeId) params.set("range_id", rangeId);
  const result = await apiFetchPaginated<Patrolling>(`/admin/patrol-entries?${params.toString()}`);
  return { ...result, data: result.data.map(normalizePatrolling) };
}

export async function getPatrolling(id: string): Promise<Patrolling> {
  const entry = await apiFetch<Patrolling>(`/admin/patrol-entries/${id}`);
  return normalizePatrolling(entry);
}

/**
 * The entry's GPS trail, oldest first. Pass `since` (an ISO timestamp,
 * typically the last point already held client-side) to fetch only newer
 * points instead of the whole trail — what the live-tracking map polls.
 */
export async function listRoutePoints(id: string, since?: string): Promise<PatrolRoutePoint[]> {
  const params = new URLSearchParams();
  if (since) params.set("since", since);
  const query = params.toString();
  const points = await apiFetch<PatrolRoutePoint[]>(
    `/admin/patrol-entries/${id}/route-points${query ? `?${query}` : ""}`,
  );
  return points.map(normalizeRoutePoint);
}
