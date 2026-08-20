import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass, inputClass } from "@/lib/ui-classes";
import { listBeats, type Beat } from "@/lib/resources/beats";
import { listAllRanges } from "@/lib/resources/ranges";
import { deleteBeatAction } from "./actions";

export default async function BeatsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; range_id?: string }>;
}) {
  const { page, range_id: rangeId } = await searchParams;
  const [{ data: beats, meta }, ranges] = await Promise.all([listBeats(Number(page) || 1, rangeId), listAllRanges()]);
  const rangeName = new Map(ranges.map((r) => [r.id, r.range_name]));

  const columns: Column<Beat>[] = [
    { header: "Name", render: (b) => <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.name}</span> },
    { header: "Range", render: (b) => rangeName.get(b.range_id) ?? b.range_id },
    { header: "Status", render: (b) => <span className={badgeClass(b.status)}>{b.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (b) => (
        <div className="flex gap-2">
          <Link href={`/beats/${b.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteBeatAction.bind(null, b.id)}
            confirmMessage={`Delete beat "${b.name}"?`}
            successMessage="Beat deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Beats</h1>
        <Link href="/beats/new" className={primaryButtonClass}>
          New Beat
        </Link>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="w-64 space-y-1">
          <label htmlFor="range_id" className="block text-xs font-medium text-zinc-500">
            Filter by range
          </label>
          <select id="range_id" name="range_id" defaultValue={rangeId ?? ""} className={inputClass}>
            <option value="">All ranges</option>
            {ranges.map((r) => (
              <option key={r.id} value={r.id}>
                {r.range_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={linkButtonClass}>
          Apply
        </button>
      </form>

      <DataTable columns={columns} rows={beats} rowKey={(b) => b.id} emptyMessage="No beats yet." />
      <Pagination meta={meta} basePath="/beats" extraParams={{ range_id: rangeId }} />
    </div>
  );
}
