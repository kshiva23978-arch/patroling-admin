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

/** A ranger-entered "No.s" count for a category, broken down by the litterer's country — plus an optional KG weight for that same row. */
export interface BeachCleaningSegregationRef {
  id: string;
  country: BeachCleaningRefShape | null;
  waste_category: BeachCleaningRefShape | null;
  quantity_kg: number;
  weight_kg: number | null;
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

export interface BeachCleaningReportFilters {
  destinationId?: string;
  beachId?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * The fixed "Waste Segregation Format for Sample of 10% (Lot)" report — see
 * `AdminBeachCleaningActivityController::report`. `countries`/`categories`
 * are always the full, fixed master lists in a stable order (22/9
 * entries); `matrix[country][category]` is always present, `0` standing in
 * for nothing recorded rather than an omitted cell.
 *
 * The `estimated_*` fields scale that same recorded (sampled) data up to a
 * projected 100% collection, per the paper form's own "SAMPLE OF 10%"
 * title — `estimated_grand_total` minus `grand_total` is the estimated
 * ~90% that was never individually sorted/counted. `total_bags` is a real
 * physical count, not a sample, so it has no estimated counterpart.
 */
export interface BeachCleaningReportData {
  countries: string[];
  categories: string[];
  matrix: Record<string, Record<string, number>>;
  country_totals: Record<string, number>;
  category_totals: Record<string, number>;
  grand_total: number;
  total_bags: number;
  activity_count: number;
  estimated_matrix: Record<string, Record<string, number>>;
  estimated_country_totals: Record<string, number>;
  estimated_category_totals: Record<string, number>;
  estimated_grand_total: number;
}

export interface BeachCleaningWeightRow {
  name: string;
  weight_kg: number;
}

/**
 * Total collected weight across every drive matching the current filters —
 * see `AdminBeachCleaningActivityController::weightSummary`. Both
 * breakdowns sum the same country-wise segregation rows' `weight_kg`,
 * `by_category` grouping them by waste category and `by_destination` by
 * each row's own drive's destination.
 */
export interface BeachCleaningWeightSummary {
  by_category: BeachCleaningWeightRow[];
  by_destination: BeachCleaningWeightRow[];
  total_weight_kg: number;
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
    segregations: (activity.segregations ?? []).map((s) => ({
      ...s,
      quantity_kg: toNumber(s.quantity_kg),
      weight_kg: toNumberOrNull(s.weight_kg),
    })),
    report: normalizeReport(activity.report ?? null),
  };
}

export interface BeachCleaningFilters {
  status?: BeachCleaningStatus;
  destinationId?: string;
  beachId?: string;
  createdBy?: string;
}

function filterParams(filters: BeachCleaningFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.destinationId) params.set("destination_id", filters.destinationId);
  if (filters.beachId) params.set("beach_id", filters.beachId);
  if (filters.createdBy) params.set("created_by", filters.createdBy);
  return params;
}

export async function listBeachCleaningActivities(
  page = 1,
  filters: BeachCleaningFilters = {},
): Promise<Paginated<BeachCleaningActivity>> {
  const params = filterParams(filters);
  params.set("page", String(page));
  const result = await apiFetchPaginated<BeachCleaningActivity>(
    `/admin/beach-cleaning-activities?${params.toString()}`,
  );
  return { ...result, data: result.data.map(normalizeActivity) };
}

/** Weight totals (by category, by destination) across every drive matching [filters] — powers the list page's summary. */
export async function getBeachCleaningWeightSummary(
  filters: BeachCleaningFilters = {},
): Promise<BeachCleaningWeightSummary> {
  const params = filterParams(filters);
  const summary = await apiFetch<BeachCleaningWeightSummary>(
    `/admin/beach-cleaning-activities/weight-summary?${params.toString()}`,
  );
  const normalizeRows = (rows: BeachCleaningWeightRow[]) => rows.map((r) => ({ ...r, weight_kg: toNumber(r.weight_kg) }));
  return {
    by_category: normalizeRows(summary.by_category),
    by_destination: normalizeRows(summary.by_destination),
    total_weight_kg: toNumber(summary.total_weight_kg),
  };
}

/** Generates the fixed country × waste-category report for [filters] — see `AdminBeachCleaningActivityController::report`. */
export async function getBeachCleaningReport(filters: BeachCleaningReportFilters = {}): Promise<BeachCleaningReportData> {
  const params = new URLSearchParams();
  if (filters.destinationId) params.set("destination_id", filters.destinationId);
  if (filters.beachId) params.set("beach_id", filters.beachId);
  if (filters.createdBy) params.set("created_by", filters.createdBy);
  if (filters.dateFrom) params.set("date_from", filters.dateFrom);
  if (filters.dateTo) params.set("date_to", filters.dateTo);

  const report = await apiFetch<BeachCleaningReportData>(`/admin/beach-cleaning-activities/report?${params.toString()}`);

  const normalizeRecord = (record: Record<string, number>) =>
    Object.fromEntries(Object.entries(record).map(([key, value]) => [key, toNumber(value)]));

  return {
    ...report,
    matrix: Object.fromEntries(Object.entries(report.matrix).map(([country, row]) => [country, normalizeRecord(row)])),
    country_totals: normalizeRecord(report.country_totals),
    category_totals: normalizeRecord(report.category_totals),
    grand_total: toNumber(report.grand_total),
    total_bags: toNumber(report.total_bags),
    activity_count: toNumber(report.activity_count),
    estimated_matrix: Object.fromEntries(
      Object.entries(report.estimated_matrix).map(([country, row]) => [country, normalizeRecord(row)]),
    ),
    estimated_country_totals: normalizeRecord(report.estimated_country_totals),
    estimated_category_totals: normalizeRecord(report.estimated_category_totals),
    estimated_grand_total: toNumber(report.estimated_grand_total),
  };
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
 * Deletes a beach cleaning drive outright — its media and segregations go
 * with it (see backend `AdminBeachCleaningActivityController::destroy`).
 */
export function deleteBeachCleaningActivity(id: string): Promise<void> {
  return apiFetch<void>(`/admin/beach-cleaning-activities/${id}`, { method: "DELETE" });
}
