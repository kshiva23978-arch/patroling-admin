import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass, inputClass } from "@/lib/ui-classes";
import { listBeaches, type Beach } from "@/lib/resources/beaches";
import { listAllDestinations } from "@/lib/resources/destinations";
import { deleteBeachAction } from "./actions";

export default async function BeachesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; destination_id?: string }>;
}) {
  const { page, destination_id: destinationId } = await searchParams;
  const [{ data: beaches, meta }, destinations] = await Promise.all([
    listBeaches(Number(page) || 1, destinationId),
    listAllDestinations(),
  ]);
  const destinationName = new Map(destinations.map((d) => [d.id, d.name]));

  const columns: Column<Beach>[] = [
    { header: "Name", render: (b) => <span className="font-medium text-zinc-900">{b.name}</span> },
    { header: "Destination", render: (b) => destinationName.get(b.destination_id) ?? b.destination_id },
    { header: "Status", render: (b) => <span className={badgeClass(b.status)}>{b.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (b) => (
        <div className="flex gap-2">
          <Link href={`/beaches/${b.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteBeachAction.bind(null, b.id)}
            confirmMessage={`Delete beach "${b.name}"?`}
            successMessage="Beach deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Beaches</h1>
        <Link href="/beaches/new" className={primaryButtonClass}>
          New Beach
        </Link>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="w-64 space-y-1">
          <label htmlFor="destination_id" className="block text-xs font-medium text-zinc-500">
            Filter by destination
          </label>
          <select id="destination_id" name="destination_id" defaultValue={destinationId ?? ""} className={inputClass}>
            <option value="">All destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={linkButtonClass}>
          Apply
        </button>
      </form>

      <DataTable columns={columns} rows={beaches} rowKey={(b) => b.id} emptyMessage="No beaches yet." />
      <Pagination meta={meta} basePath="/beaches" extraParams={{ destination_id: destinationId }} />
    </div>
  );
}
