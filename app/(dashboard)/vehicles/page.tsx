import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass, inputClass } from "@/lib/ui-classes";
import { listVehicles, type Vehicle } from "@/lib/resources/vehicles";
import { listAllRanges } from "@/lib/resources/ranges";
import { deleteVehicleAction } from "./actions";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; range_id?: string }>;
}) {
  const { page, range_id: rangeId } = await searchParams;
  const [{ data: vehicles, meta }, ranges] = await Promise.all([
    listVehicles(Number(page) || 1, rangeId),
    listAllRanges(),
  ]);
  const rangeName = new Map(ranges.map((r) => [r.id, r.range_name]));

  const columns: Column<Vehicle>[] = [
    { header: "Registration", render: (v) => <span className="font-medium text-zinc-900">{v.registration_number}</span> },
    { header: "Type", render: (v) => <span className="capitalize">{v.type}</span> },
    { header: "Range", render: (v) => rangeName.get(v.range_id) ?? v.range_id },
    { header: "Status", render: (v) => <span className={badgeClass(v.status)}>{v.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (v) => (
        <div className="flex gap-2">
          <Link href={`/vehicles/${v.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteVehicleAction.bind(null, v.id)}
            confirmMessage={`Delete vehicle "${v.registration_number}"?`}
            successMessage="Vehicle deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Vehicles</h1>
        <Link href="/vehicles/new" className={primaryButtonClass}>
          New Vehicle
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

      <DataTable columns={columns} rows={vehicles} rowKey={(v) => v.id} emptyMessage="No vehicles yet." />
      <Pagination meta={meta} basePath="/vehicles" extraParams={{ range_id: rangeId }} />
    </div>
  );
}
