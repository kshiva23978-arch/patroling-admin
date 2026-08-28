import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";

export type ActivityStatus = "in_progress" | "completed";

export interface ActivityLocation {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
}

export interface ActivityCreatedBy {
  id: string;
  employee_id: string;
  name: string | null;
}

export interface ActivityParticipant {
  id: string;
  name: string;
}

export interface ActivityMedia {
  id: string;
  caption: string | null;
  file_size: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
}

/** Shape returned by `/admin/activities` — see AdminActivityResource. */
export interface Activity {
  id: string;
  name: string;
  description: string | null;
  conducted_by: string;
  status: ActivityStatus;
  location: ActivityLocation;
  report: string | null;
  created_by: ActivityCreatedBy | null;
  participants: ActivityParticipant[];
  media: ActivityMedia[];
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
}

/**
 * Postgres decimal columns come back from the Laravel API as JSON strings
 * (e.g. `"11.6767400"`), not numbers — coerce them so callers (esp. the map)
 * always get real numbers.
 */
function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeActivity(activity: Activity): Activity {
  return {
    ...activity,
    location: {
      ...activity.location,
      latitude: toNumberOrNull(activity.location.latitude),
      longitude: toNumberOrNull(activity.location.longitude),
    },
    media: activity.media.map((m) => ({
      ...m,
      latitude: toNumberOrNull(m.latitude),
      longitude: toNumberOrNull(m.longitude),
    })),
  };
}

export async function listActivities(
  page = 1,
  status?: ActivityStatus,
): Promise<Paginated<Activity>> {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  const result = await apiFetchPaginated<Activity>(`/admin/activities?${params.toString()}`);
  return { ...result, data: result.data.map(normalizeActivity) };
}

export async function getActivity(id: string): Promise<Activity> {
  const activity = await apiFetch<Activity>(`/admin/activities/${id}`);
  return normalizeActivity(activity);
}

/**
 * Deletes an activity outright — its participants and photos go with it
 * (see backend `AdminActivityController::destroy`).
 */
export function deleteActivity(id: string): Promise<void> {
  return apiFetch<void>(`/admin/activities/${id}`, { method: "DELETE" });
}
