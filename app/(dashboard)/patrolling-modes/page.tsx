import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, linkButtonClass } from "@/lib/ui-classes";
import { listPatrollingModes, type PatrollingMode } from "@/lib/resources/patrolling-modes";
import { deletePatrollingModeAction } from "./actions";

export default async function PatrollingModesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: modes, meta } = await listPatrollingModes(Number(page) || 1);

  const columns: Column<PatrollingMode>[] = [
    { header: "Mode Name", render: (m) => <span className="font-medium text-zinc-900 dark:text-zinc-50">{m.mode_name}</span> },
    {
      header: "Actions",
      render: (m) => (
        <div className="flex gap-2">
          <Link href={`/patrolling-modes/${m.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deletePatrollingModeAction.bind(null, m.id)}
            confirmMessage={`Delete patrolling mode "${m.mode_name}"?`}
            successMessage="Patrolling mode deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Patrolling Modes</h1>
        <Link href="/patrolling-modes/new" className={primaryButtonClass}>
          New Patrolling Mode
        </Link>
      </div>
      <DataTable columns={columns} rows={modes} rowKey={(m) => m.id} emptyMessage="No patrolling modes yet." />
      <Pagination meta={meta} basePath="/patrolling-modes" />
    </div>
  );
}
