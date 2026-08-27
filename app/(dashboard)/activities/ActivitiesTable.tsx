import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { linkButtonClass, badgeClass } from "@/lib/ui-classes";
import type { Activity, ActivityStatus } from "@/lib/resources/activities";
import type { Paginated } from "@/lib/api-client";

export function ActivitiesTable({
  data,
  status,
}: {
  data: Paginated<Activity>;
  status?: ActivityStatus;
}) {
  const columns: Column<Activity>[] = [
    {
      header: "Activity",
      render: (a) => <span className="font-medium text-zinc-900">{a.name}</span>,
    },
    {
      header: "Conducted By",
      render: (a) => a.conducted_by,
    },
    {
      header: "Created By",
      render: (a) =>
        a.created_by?.name || a.created_by?.employee_id || <span className="text-zinc-400">—</span>,
    },
    {
      header: "Status",
      render: (a) => (
        <span className={badgeClass(a.status === "in_progress")}>
          {a.status === "in_progress" ? "In Progress" : "Completed"}
        </span>
      ),
    },
    {
      header: "Participants",
      render: (a) => a.participants.length,
    },
    {
      header: "Photos",
      render: (a) => a.media.length,
    },
    {
      header: "Started",
      render: (a) => (a.started_at ? new Date(a.started_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—"),
    },
    {
      header: "Actions",
      render: (a) => (
        <Link href={`/activities/${a.id}`} className={linkButtonClass}>
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={data.data} rowKey={(a) => a.id} emptyMessage="No activities yet." />
      <Pagination meta={data.meta} basePath="/activities" extraParams={{ status }} />
    </div>
  );
}
