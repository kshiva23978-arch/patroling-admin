import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";

export type BeachCleaningStatus = "in_progress" | "submitted";

export interface BeachCleaningRefShape {
  id: string;
  name: string;
}

export interface BeachCleaningOfficerRef {
  id: string;
  employee_id: string;
  name: string | null;
}

export interface BeachCleaningLocation {
  latitude: number | null;
  longitude: number | null;
}

/** One captured photo — see `BeachCleaningMedia::KINDS` (`before`/`other`/`collection`). */
export interface BeachCleaningMediaRef {
  id: string;
  kind: "before" | "other" | "collection";
  file_size: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
}

/** A ranger-entered "No.s" count for a category, broken down by the litterer's country. */
export interface BeachCleaningSegregationRef {
  id: string;
  country: BeachCleaningRefShape | null;
  waste_category: BeachCleaningRefShape | null;
  quantity_kg: number;
}

/** A ranger-entered KG weight for a category — independent of country/segregation counts. */
export interface BeachCleaningCategoryWeightRef {
  id: string;
  waste_category: BeachCleaningRefShape | null;
  weight_kg: number;
}

export interface BeachCleaningReportRow {
  name: string;
  quantity_kg: number;
}

/** Server-computed breakdown of a drive's segregations/category weights. */
export interface BeachCleaningReport {
  by_category: BeachCleaningReportRow[];
  by_country: BeachCleaningReportRow[];
  by_category_weight: BeachCleaningReportRow[];
  segregated_total_kg: number;
  segregated_weight_total_kg: number;
}

/** Shape returned by `/admin/beach-cleaning-activities` — see AdminBeachCleaningActivityResource. */
export interface BeachCleaningActivity {
  id: string;
  activity_name: string;
  officer_name: string | null;
  status: BeachCleaningStatus;
  destination: BeachCleaningRefShape | null;
  beach: BeachCleaningRefShape | null;
  location: BeachCleaningLocation;
  /** The ranger who created the drive — resource key is "officer", not "created_by". */
  officer: BeachCleaningOfficerRef | null;
  summary: string | null;
  participant_count: number | null;
  bags_collected: number | null;
  total_weight_kg: number | null;
  segregation_percent: number | null;
  closing_report: string | null;
  handover_to: string | null;
  media: BeachCleaningMediaRef[];
  segregations: BeachCleaningSegregationRef[];
  category_weights: BeachCleaningCategoryWeightRef[];
  report: BeachCleaningReport | null;
  submitted_at: string | null;
  created_at: string | null;
}

/** One ranger option for the admin "Ranger" filter — see AdminBeachCleaningActivityController::rangers. */
export interface BeachCleaningRangerOption {
  id: string;
  employee_id: string;
  name: string | null;
}

/**
 * Postgres decimal columns come back from the Laravel API as JSON strings
 * (e.g. `"11.6767400"`), not numbers — coerce them so callers always get
 * real numbers. Mirrors the same normalization in `lib/resources/patrollings.ts`.
 */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumber(value: unknown): number {
  return toNumberOrNull(value) ?? 0;
}

function normalizeReport(report: BeachCleaningReport | null): BeachCleaningReport | null {
  if (!report) return null;
  const normalizeRows = (rows: BeachCleaningReportRow[]) =>
    rows.map((r) => ({ ...r, quantity_kg: toNumber(r.quantity_kg) }));
  return {
    by_category: normalizeRows(report.by_category),
    by_country: normalizeRows(report.by_country),
    by_category_weight: normalizeRows(report.by_category_weight),
    segregated_total_kg: toNumber(report.segregated_total_kg),
    segregated_weight_total_kg: toNumber(report.segregated_weight_total_kg),
  };
}

function normalizeActivity(activity: BeachCleaningActivity): BeachCleaningActivity {
  return {
    ...activity,
    location: {
      latitude: toNumberOrNull(activity.location?.latitude),
      longitude: toNumberOrNull(activity.location?.longitude),
    },
    participant_count: toNumberOrNull(activity.participant_count),
    bags_collected: toNumberOrNull(activity.bags_collected),
    total_weight_kg: toNumberOrNull(activity.total_weight_kg),
    segregation_percent: toNumberOrNull(activity.segregation_percent),
    segregations: (activity.segregations ?? []).map((s) => ({ ...s, quantity_kg: toNumber(s.quantity_kg) })),
    category_weights: (activity.category_weights ?? []).map((w) => ({ ...w, weight_kg: toNumber(w.weight_kg) })),
    report: normalizeReport(activity.report ?? null),
  };
}

export interface BeachCleaningFilters {
  status?: BeachCleaningStatus;
  destinationId?: string;
  beachId?: string;
  createdBy?: string;
}

export async function listBeachCleaningActivities(
  page = 1,
  filters: BeachCleaningFilters = {},
): Promise<Paginated<BeachCleaningActivity>> {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.status) params.set("status", filters.status);
  if (filters.destinationId) params.set("destination_id", filters.destinationId);
  if (filters.beachId) params.set("beach_id", filters.beachId);
  if (filters.createdBy) params.set("created_by", filters.createdBy);
  const result = await apiFetchPaginated<BeachCleaningActivity>(
    `/admin/beach-cleaning-activities?${params.toString()}`,
  );
  return { ...result, data: result.data.map(normalizeActivity) };
}

export async function getBeachCleaningActivity(id: string): Promise<BeachCleaningActivity> {
  const activity = await apiFetch<BeachCleaningActivity>(`/admin/beach-cleaning-activities/${id}`);
  return normalizeActivity(activity);
}

/** Rangers who have logged at least one drive visible to the signed-in admin — for the "Ranger" filter dropdown. */
export function listBeachCleaningRangers(): Promise<BeachCleaningRangerOption[]> {
  return apiFetch<BeachCleaningRangerOption[]>("/admin/beach-cleaning-activities/rangers");
}

/**
 * Deletes a beach cleaning drive outright — its media, segregations, and
 * category weights go with it (see backend `AdminBeachCleaningActivityController::destroy`).
 */
export function deleteBeachCleaningActivity(id: string): Promise<void> {
  return apiFetch<void>(`/admin/beach-cleaning-activities/${id}`, { method: "DELETE" });
}
