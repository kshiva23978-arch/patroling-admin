import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { badgeClass, linkButtonClass } from "@/lib/ui-classes";
import type { Paginated } from "@/lib/api-client";
import type { BeachCleaningActivity, BeachCleaningFilters } from "@/lib/resources/beach-cleaning-activities";
import { deleteBeachCleaningActivityAction } from "./actions";

export function BeachCleaningActivitiesTable({
  data,
  filters,
}: {
  data: Paginated<BeachCleaningActivity>;
  filters: BeachCleaningFilters;
}) {
  const columns: Column<BeachCleaningActivity>[] = [
    {
      header: "Activity",
      render: (a) => <span className="font-medium text-zinc-900">{a.activity_name}</span>,
    },
    {
      header: "Ranger",
      render: (a) => a.officer?.name || a.officer?.employee_id || <span className="text-zinc-400">—</span>,
    },
    {
      header: "Destination",
      render: (a) => a.destination?.name ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Beach",
      render: (a) => a.beach?.name ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Status",
      render: (a) => (
        <span className={badgeClass(a.status === "submitted")}>
          {a.status === "submitted" ? "Submitted" : "In Progress"}
        </span>
      ),
    },
    {
      header: "Bags",
      render: (a) => a.bags_collected ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Weight (kg)",
      render: (a) => (a.total_weight_kg !== null ? a.total_weight_kg.toFixed(1) : <span className="text-zinc-400">—</span>),
    },
    {
      header: "Created",
      render: (a) =>
        a.created_at
          ? new Date(a.created_at).toLocaleDateString([], { dateStyle: "medium", timeZone: "Asia/Kolkata" })
          : "—",
    },
    {
      header: "Actions",
      render: (a) => (
        <div className="flex gap-2">
          <Link href={`/beach-cleaning-activities/${a.id}`} className={linkButtonClass}>
            View
          </Link>
          <ConfirmDeleteButton
            action={deleteBeachCleaningActivityAction.bind(null, a.id)}
            confirmMessage={`Delete drive "${a.activity_name}"? This also removes its photos, segregations, and category weights. This cannot be undone.`}
            successMessage="Beach cleaning drive deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={data.data} rowKey={(a) => a.id} emptyMessage="No beach cleaning drives yet." />
      <Pagination
        meta={data.meta}
        basePath="/beach-cleaning-activities"
        extraParams={{
          status: filters.status,
          destination_id: filters.destinationId,
          beach_id: filters.beachId,
          created_by: filters.createdBy,
        }}
      />
    </div>
  );
}
