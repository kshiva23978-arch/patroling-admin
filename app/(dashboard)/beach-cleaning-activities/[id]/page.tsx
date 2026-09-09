import { notFound } from "next/navigation";
import Link from "next/link";
import { PhotoGrid } from "@/components/media/PhotoLightbox";
import { getBeachCleaningActivity } from "@/lib/resources/beach-cleaning-activities";
import type { BeachCleaningReportRow } from "@/lib/resources/beach-cleaning-activities";
import { cardClass, badgeClass } from "@/lib/ui-classes";

const MEDIA_BASE_URL = "/api/beach-cleaning-media";

export default async function BeachCleaningActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getBeachCleaningActivity(id).catch(() => null);
  if (!activity) notFound();

  const beforePhotos = activity.media.filter((m) => m.kind === "before");
  const collectionPhotos = activity.media.filter((m) => m.kind === "collection");
  const otherPhotos = activity.media.filter((m) => m.kind === "other");

  return (
    <div className="space-y-4">
      <div>
        <Link href="/beach-cleaning-activities" className="text-sm text-zinc-500 hover:underline">
          &larr; Beach Cleaning
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{activity.activity_name}</h1>
          <span className={badgeClass(activity.status === "submitted")}>
            {activity.status === "submitted" ? "Submitted" : "In Progress"}
          </span>
        </div>
      </div>

      <Section title="Drive Details">
        {activity.summary && <p className="mb-3 text-sm text-zinc-700">{activity.summary}</p>}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Field label="Ranger" value={officerLabel(activity.officer)} />
          <Field label="Officer / Point of Contact" value={activity.officer_name || "—"} />
          <Field label="Destination" value={activity.destination?.name || "—"} />
          <Field label="Beach" value={activity.beach?.name || "—"} />
          <Field label="Participants" value={activity.participant_count ?? "—"} />
          <Field label="Bags Collected" value={activity.bags_collected ?? "—"} />
          <Field label="Total Weight" value={activity.total_weight_kg !== null ? `${activity.total_weight_kg.toFixed(1)} kg` : "—"} />
          <Field
            label="Segregation"
            value={activity.segregation_percent !== null ? `${activity.segregation_percent}%` : "—"}
          />
          <Field
            label="Created"
            value={
              activity.created_at
                ? new Date(activity.created_at).toLocaleString([], { timeZone: "Asia/Kolkata" })
                : "—"
            }
          />
          <Field
            label="Submitted"
            value={
              activity.submitted_at
                ? new Date(activity.submitted_at).toLocaleString([], { timeZone: "Asia/Kolkata" })
                : "—"
            }
          />
          <Field label="Solid Waste Handover To" value={activity.handover_to || "—"} />
        </dl>
        {activity.location.latitude !== null && activity.location.longitude !== null && (
          <p className="mt-3 text-xs text-zinc-500">
            {activity.location.latitude.toFixed(5)}, {activity.location.longitude.toFixed(5)}
          </p>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-3">
        <ReportTable title="Waste By Category" rows={activity.report?.by_category ?? []} unit="No.s" />
        <ReportTable title="Country-Wise Collection" rows={activity.report?.by_country ?? []} unit="No.s" />
        <ReportTable title="Category-Wise Weight" rows={activity.report?.by_category_weight ?? []} unit="kg" />
      </div>

      <Section title={`Before Photos (${beforePhotos.length})`}>
        <PhotoGrid items={beforePhotos} baseUrl={MEDIA_BASE_URL} emptyMessage="No before photo captured." />
      </Section>

      <Section title={`Collection Photos (${collectionPhotos.length})`}>
        <PhotoGrid items={collectionPhotos} baseUrl={MEDIA_BASE_URL} emptyMessage="No collection photo captured." />
      </Section>

      <Section title={`Other Photos (${otherPhotos.length})`}>
        <PhotoGrid items={otherPhotos} baseUrl={MEDIA_BASE_URL} emptyMessage="No other photos captured." />
      </Section>

      {activity.status === "submitted" && (
        <Section title="Closing Report">
          <p className="whitespace-pre-wrap text-sm text-zinc-700">
            {activity.closing_report || "No closing report was written."}
          </p>
        </Section>
      )}
    </div>
  );
}

function officerLabel(officer: { employee_id: string; name: string | null } | null): string {
  if (!officer) return "—";
  return officer.name ? `${officer.name} (${officer.employee_id})` : officer.employee_id;
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
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}

function ReportTable({ title, rows, unit }: { title: string; rows: BeachCleaningReportRow[]; unit: string }) {
  const total = rows.reduce((sum, r) => sum + r.quantity_kg, 0);
  return (
    <div className={`space-y-2 p-4 ${cardClass}`}>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">No data recorded.</p>
      ) : (
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1.5 pr-4 text-zinc-700">{row.name}</td>
                <td className="py-1.5 text-right font-medium text-zinc-900">
                  {row.quantity_kg} {unit}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200">
              <td className="py-1.5 pr-4 text-right font-semibold text-zinc-900">Total</td>
              <td className="py-1.5 text-right font-semibold text-zinc-900">
                {total} {unit}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
