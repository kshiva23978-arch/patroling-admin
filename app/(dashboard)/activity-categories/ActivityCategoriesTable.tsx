import { Column, DataTable } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { linkButtonClass } from "@/lib/ui-classes";
import type { ActivityCategory } from "@/lib/resources/activity-categories";
import type { Paginated } from "@/lib/api-client";
import { deleteActivityCategoryAction } from "./actions";


export function ActivityCategoriesTable({
  data,
}: { 
    data: Paginated<ActivityCategory>;
}) {
  const columns: Column<ActivityCategory>[] = [
    {
      header: "Name",
      render: (a) => <span className="font-medium text-zinc-900">{a.name}</span>,
    },
    {
      header: "Description",
        render: (a) => a.description || <span className="text-zinc-400">—</span>,
    },
    {
        header: "Has Report",
        render: (a) => a.has_report ? "Yes" : "No",
    },
    {
        header: "Created By",
        render: (a) =>
            a.created_by?.name || a.created_by?.employee_id || <span className="text-zinc-400">—</span>,

    },
    {
        header: "Actions",
        render: (a) => (
            <div className="flex gap-2">
                <Link href={`/activity-categories/${a.id}`} className={linkButtonClass}>
                    View
                </Link>
                <Link href={`/activity-categories/${a.id}/edit`} className={linkButtonClass}>
                    Edit
                </Link>
                {a.has_report && (
                    <Link href={`/activity-categories/${a.id}/report-fields`} className={linkButtonClass}>
                        Report Fields
                    </Link>
                )}
                <ConfirmDeleteButton
                    action = {deleteActivityCategoryAction.bind(null, a.id)}
                    confirmMessage = {`Are you sure you want to delete the activity category "${a.name}"? This action cannot be undone.`}
                    successMessage = {`Activity category "${a.name}" deleted successfully.`}/>            
            </div>
        ),
    },
    ];
    return (
        <div className="space-y-4">
            <DataTable columns={columns} rows={data.data} rowKey={(a) => a.id} emptyMessage="No activity categories yet." />
            <Pagination meta={data.meta} basePath="/activity-categories" />
        </div>
    );
}