import { notFound } from "next/navigation";
import Link from "next/link";
import { PhotoGrid } from "@/components/media/PhotoLightbox";
import { getActivity } from "@/lib/resources/activities";
import { cardClass, badgeClass } from "@/lib/ui-classes";
import { ActivityMap } from "./ActivityMap";

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getActivity(id).catch(() => null);
  if (!activity) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/activities" className="text-sm text-zinc-500 hover:underline">
          &larr; Activities
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">{activity.name}</h1>
          <span className={badgeClass(activity.status === "in_progress")}>
            {activity.status === "in_progress" ? "In Progress" : "Completed"}
          </span>
        </div>
      </div>

      <div className={`space-y-3 p-4 ${cardClass}`}>
        {activity.description && <p className="text-sm text-zinc-700">{activity.description}</p>}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Conducted By" value={activity.conducted_by} />
          <Info
            label="Created By"
            value={activity.created_by?.name || activity.created_by?.employee_id || "—"}
          />
          <Info
            label="Started"
            value={
              activity.started_at
                ? new Date(activity.started_at).toLocaleString([], { timeZone: "Asia/Kolkata" })
                : "—"
            }
          />
          <Info
            label="Ended"
            value={
              activity.ended_at
                ? new Date(activity.ended_at).toLocaleString([], { timeZone: "Asia/Kolkata" })
                : "—"
            }
          />
        </dl>
        {activity.location.address && (
          <p className="text-xs text-zinc-500">{activity.location.address}</p>
        )}
      </div>

      <ActivityMap location={activity.location} name={activity.name} />

      <div className={`space-y-2 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">
          Participants ({activity.participants.length})
        </h2>
        {activity.participants.length === 0 ? (
          <p className="text-sm text-zinc-400">No participants recorded.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activity.participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`space-y-3 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Photos ({activity.media.length})</h2>
        <PhotoGrid items={activity.media} baseUrl="/api/activity-media" emptyMessage="No photos captured." />
      </div>

      {activity.status === "completed" && (
        <div className={`space-y-2 p-4 ${cardClass}`}>
          <h2 className="text-sm font-semibold text-zinc-900">Activity Report / Conclusion</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">
            {activity.report || "No report was written."}
          </p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}
