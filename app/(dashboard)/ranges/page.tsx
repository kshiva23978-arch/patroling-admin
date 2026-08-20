import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, linkButtonClass } from "@/lib/ui-classes";
import { listRanges, type Range } from "@/lib/resources/ranges";
import { deleteRangeAction } from "./actions";

export default async function RangesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: ranges, meta } = await listRanges(Number(page) || 1);

  const columns: Column<Range>[] = [
    { header: "Range ID", render: (r) => r.range_id },
    { header: "Name", render: (r) => <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.range_name}</span> },
    { header: "Category", render: (r) => r.category || <span className="text-zinc-400">—</span> },
    { header: "Headquarter", render: (r) => r.range_headquarter },
    { header: "Patrolling Modes", render: (r) => r.patrolling_modes.map((m) => m.mode_name).join(", ") || <span className="text-zinc-400">—</span> },
    {
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <Link href={`/ranges/${r.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteRangeAction.bind(null, r.id)}
            confirmMessage={`Delete range "${r.range_name}"? This also removes its beats and vehicles.`}
            successMessage="Range deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Ranges</h1>
        <Link href="/ranges/new" className={primaryButtonClass}>
          New Range
        </Link>
      </div>
      <DataTable columns={columns} rows={ranges} rowKey={(r) => r.id} emptyMessage="No ranges yet." />
      <Pagination meta={meta} basePath="/ranges" />
    </div>
  );
}
