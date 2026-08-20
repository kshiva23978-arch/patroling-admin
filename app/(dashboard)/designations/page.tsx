import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listDesignations, type Designation } from "@/lib/resources/designations";
import { deleteDesignationAction } from "./actions";

export default async function DesignationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: designations, meta } = await listDesignations(Number(page) || 1);

  const columns: Column<Designation>[] = [
    { header: "Rank", render: (d) => d.rank_order },
    { header: "Name", render: (d) => <span className="font-medium text-zinc-900 dark:text-zinc-50">{d.designation_name}</span> },
    { header: "Description", render: (d) => d.description || <span className="text-zinc-400">—</span> },
    { header: "Status", render: (d) => <span className={badgeClass(d.status)}>{d.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (d) => (
        <div className="flex gap-2">
          <Link href={`/designations/${d.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteDesignationAction.bind(null, d.id)}
            confirmMessage={`Delete designation "${d.designation_name}"?`}
            successMessage="Designation deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Designations</h1>
        <Link href="/designations/new" className={primaryButtonClass}>
          New Designation
        </Link>
      </div>
      <DataTable columns={columns} rows={designations} rowKey={(d) => d.id} emptyMessage="No designations yet." />
      <Pagination meta={meta} basePath="/designations" />
    </div>
  );
}
