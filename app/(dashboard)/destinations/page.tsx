import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listDestinations, type Destination } from "@/lib/resources/destinations";
import { deleteDestinationAction } from "./actions";

export default async function DestinationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: destinations, meta } = await listDestinations(Number(page) || 1);

  const columns: Column<Destination>[] = [
    { header: "Name", render: (d) => <span className="font-medium text-zinc-900">{d.name}</span> },
    { header: "Status", render: (d) => <span className={badgeClass(d.status)}>{d.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (d) => (
        <div className="flex gap-2">
          <Link href={`/destinations/${d.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteDestinationAction.bind(null, d.id)}
            confirmMessage={`Delete destination "${d.name}"? This also removes its beaches.`}
            successMessage="Destination deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Destinations</h1>
        <Link href="/destinations/new" className={primaryButtonClass}>
          New Destination
        </Link>
      </div>
      <DataTable columns={columns} rows={destinations} rowKey={(d) => d.id} emptyMessage="No destinations yet." />
      <Pagination meta={meta} basePath="/destinations" />
    </div>
  );
}
