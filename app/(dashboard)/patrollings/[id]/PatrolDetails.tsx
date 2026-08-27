"use client";

import { PhotoGrid } from "@/components/media/PhotoLightbox";
import { cardClass } from "@/lib/ui-classes";
import { haversineKm } from "@/lib/geo";
import type {
  Patrolling,
  PatrolRoutePoint,
  PatrolCustomFieldValueRef,
  PatrolLeaderRef,
} from "@/lib/resources/patrollings";

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  "2_wheeler": "2 Wheeler",
  "4_wheeler": "4 Wheeler",
  boat: "Boat",
};

/** Distance covered while walking, summed only across consecutive GPS points that were both recorded while walking. */
function walkingDistanceKm(points: PatrolRoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].travel_mode === "walking" && points[i - 1].travel_mode === "walking") {
      total += haversineKm(
        { lat: points[i - 1].latitude, lng: points[i - 1].longitude },
        { lat: points[i].latitude, lng: points[i].longitude },
      );
    }
  }
  return total;
}

function createdByLabel(leader: PatrolLeaderRef | null): string {
  if (!leader) return "—";
  return leader.name ? `${leader.name} (${leader.employee_id})` : leader.employee_id;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatDuration(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt || !endedAt) return "—";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/** Decodes a Yes/No custom field's stored value — JSON (`{"answer":"yes","names":[...]}`) with a plain '1'/'0' fallback for values written before names existed. */
function decodeBooleanValue(raw: string | null): { answer: string | null; names: string[] } {
  if (!raw) return { answer: null, names: [] };
  try {
    const decoded = JSON.parse(raw) as { answer?: string; names?: string[] };
    if (decoded && typeof decoded === "object") {
      return { answer: decoded.answer ?? null, names: decoded.names ?? [] };
    }
  } catch {
    // Fall through to the legacy-value interpretation below.
  }
  return { answer: raw === "1" ? "yes" : "no", names: [] };
}

function CustomFieldValue({ field }: { field: PatrolCustomFieldValueRef }) {
  if (field.input_type === "boolean") {
    const { answer, names } = decodeBooleanValue(field.value);
    return (
      <div>
        <p className="text-sm font-medium text-zinc-900">
          {answer === "yes" ? "Yes" : answer === "no" ? "No" : "—"}
        </p>
        {names.length > 0 && (
          <p className="mt-0.5 text-xs text-zinc-500">{names.join(", ")}</p>
        )}
      </div>
    );
  }

  return <p className="text-sm font-medium text-zinc-900">{field.value || "—"}</p>;
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 p-4 ${cardClass}`}>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-zinc-900">{value}</div>
    </div>
  );
}

/** Everything below the live map on a patrolling's detail page: timing, distance breakdown, the free-text report, admin-configured custom field answers, and the full incident/case list with photos. */
export function PatrolDetails({ entry, points }: { entry: Patrolling; points: PatrolRoutePoint[] }) {
  const walkingKm = walkingDistanceKm(points);
  const vehicleTotalKm = entry.vehicles.reduce((sum, v) => sum + (v.distance ?? 0), 0);
  const combinedTotalKm = vehicleTotalKm + walkingKm;

  return (
    <div className="space-y-4">
      <Section title="Timing & Coverage">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Created By" value={createdByLabel(entry.patrol_leader)} />
          <Field label="Date" value={entry.date || "—"} />
          <Field label="Start Time" value={entry.start_time || "—"} />
          <Field label="End Time" value={entry.end_time || "—"} />
          <Field label="Duration" value={formatDuration(entry.started_at, entry.ended_at)} />
          <Field label="Started At" value={formatDateTime(entry.started_at)} />
          <Field label="Ended At" value={formatDateTime(entry.ended_at)} />
          <Field label="Area Covered" value={entry.area_covered || "—"} />
          <Field label="Area Patrolled" value={entry.area_patrolled || "—"} />
        </div>
      </Section>

      <Section title={`Staff Deployed (${entry.staff_names.length}/${entry.staff_deployed_count})`}>
        {entry.staff_names.length === 0 ? (
          <p className="text-sm text-zinc-500">No staff named.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {entry.staff_names.map((name) => (
              <span
                key={name}
                className={
                  name === entry.incharge_staff
                    ? "inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                    : "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700"
                }
              >
                {name}
                {name === entry.incharge_staff && " (In-charge)"}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Distance by Travel Mode">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-4">Mode / Vehicle</th>
                <th className="py-2 pr-4">Registration</th>
                <th className="py-2 pr-4">Odometer</th>
                <th className="py-2 pr-4">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {entry.vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="py-2 pr-4 font-medium text-zinc-900">
                    {VEHICLE_TYPE_LABELS[v.type] ?? v.type}
                  </td>
                  <td className="py-2 pr-4 text-zinc-600">{v.registration_no || "—"}</td>
                  <td className="py-2 pr-4 text-zinc-600">
                    {v.start_odometer !== null && v.end_odometer !== null
                      ? `${v.start_odometer.toFixed(1)} → ${v.end_odometer.toFixed(1)} km`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4 font-medium text-zinc-900">
                    {v.distance !== null ? `${v.distance.toFixed(2)} km` : "—"}
                  </td>
                </tr>
              ))}
              {walkingKm > 0 && (
                <tr>
                  <td className="py-2 pr-4 font-medium text-zinc-900">Walking</td>
                  <td className="py-2 pr-4 text-zinc-600">—</td>
                  <td className="py-2 pr-4 text-zinc-600">—</td>
                  <td className="py-2 pr-4 font-medium text-zinc-900">
                    {walkingKm.toFixed(2)} km
                  </td>
                </tr>
              )}
              {entry.vehicles.length === 0 && walkingKm === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-zinc-400">
                    No travel recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
            {(entry.vehicles.length > 0 || walkingKm > 0) && (
              <tfoot>
                <tr className="border-t border-zinc-200">
                  <td colSpan={3} className="py-2 pr-4 text-right font-semibold text-zinc-900">
                    Total
                  </td>
                  <td className="py-2 pr-4 font-semibold text-zinc-900">
                    {combinedTotalKm.toFixed(2)} km
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Section>

      <Section title="Patrol Report">
        <p className="whitespace-pre-wrap text-sm text-zinc-700">
          {entry.remarks || "No report submitted."}
        </p>
      </Section>

      {entry.custom_field_values.length > 0 && (
        <Section title="Additional Field Responses">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {entry.custom_field_values.map((field) => (
              <Field
                key={field.custom_field_id}
                label={field.field_name ?? "Field"}
                value={<CustomFieldValue field={field} />}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title={`Incidents (${entry.incidents.length})`}>
        {entry.incidents.length === 0 ? (
          <p className="text-sm text-zinc-500">No incidents reported.</p>
        ) : (
          <div className="space-y-4">
            {entry.incidents.map((incident) => (
              <div
                key={incident.id}
                className="space-y-2 rounded-lg border border-zinc-200 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{incident.name}</p>
                  <p className="shrink-0 text-xs text-zinc-500">
                    {formatDateTime(incident.reported_at)}
                  </p>
                </div>
                <p className="text-sm text-zinc-700">{incident.details}</p>
                <p className="text-xs text-zinc-500">
                  {incident.location.address ||
                    (incident.location.latitude !== null
                      ? `${incident.location.latitude.toFixed(5)}, ${incident.location.longitude?.toFixed(5)}`
                      : "No location recorded")}
                </p>
                <PhotoGrid items={incident.photos} baseUrl="/api/incident-media" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Case Reports (${entry.case_reports.length})`}>
        {entry.case_reports.length === 0 ? (
          <p className="text-sm text-zinc-500">No cases filed.</p>
        ) : (
          <div className="space-y-4">
            {entry.case_reports.map((caseReport) => (
              <div
                key={caseReport.id}
                className="space-y-2 rounded-lg border border-zinc-200 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">
                    {caseReport.case_number}
                    {caseReport.conflict_type && (
                      <span className="ml-2 font-normal text-zinc-500">
                        {caseReport.conflict_type}
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-xs text-zinc-500">
                    {formatDateTime(caseReport.reported_at)}
                  </p>
                </div>
                <p className="text-sm text-zinc-700">{caseReport.details}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field
                    label="Rescue Conducted"
                    value={caseReport.rescue_conducted === null ? "—" : caseReport.rescue_conducted ? "Yes" : "No"}
                  />
                  <Field label="Species Rescued" value={caseReport.species_rescued || "—"} />
                  <Field label="Rehab Details" value={caseReport.rehab_details || "—"} />
                  <Field label="Response Time" value={caseReport.response_time || "—"} />
                </div>
                <p className="text-xs text-zinc-500">
                  {caseReport.location.address ||
                    (caseReport.location.latitude !== null
                      ? `${caseReport.location.latitude.toFixed(5)}, ${caseReport.location.longitude?.toFixed(5)}`
                      : "No location recorded")}
                </p>
                <PhotoGrid items={caseReport.photos} baseUrl="/api/case-media" />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
