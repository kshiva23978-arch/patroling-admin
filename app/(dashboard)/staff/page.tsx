import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass, inputClass } from "@/lib/ui-classes";
import { listStaff, type Staff } from "@/lib/resources/staff";
import { listAllRanges } from "@/lib/resources/ranges";
import { listAllDesignations } from "@/lib/resources/designations";
import { deleteStaffAction } from "./actions";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; range_id?: string }>;
}) {
  const { page, range_id: rangeId } = await searchParams;
  const [{ data: staff, meta }, ranges, designations] = await Promise.all([
    listStaff(Number(page) || 1, rangeId),
    listAllRanges(),
    listAllDesignations(),
  ]);
  const rangeName = new Map(ranges.map((r) => [r.id, r.range_name]));
  const designationName = new Map(designations.map((d) => [d.id, d.designation_name]));

  const columns: Column<Staff>[] = [
    { header: "Name", render: (s) => <span className="font-medium text-zinc-900">{s.name}</span> },
    { header: "Designation", render: (s) => (s.designation_id ? designationName.get(s.designation_id) ?? s.designation_id : "—") },
    { header: "Range", render: (s) => rangeName.get(s.range_id) ?? s.range_id },
    { header: "Status", render: (s) => <span className={badgeClass(s.status)}>{s.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (s) => (
        <div className="flex gap-2">
          <Link href={`/staff/${s.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteStaffAction.bind(null, s.id)}
            confirmMessage={`Delete staff member "${s.name}"?`}
            successMessage="Staff member deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Staff</h1>
          <p className="text-sm text-zinc-500">Named staff deployed on Patrolling and Case entries.</p>
        </div>
        <Link href="/staff/new" className={primaryButtonClass}>
          New Staff
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

      <DataTable columns={columns} rows={staff} rowKey={(s) => s.id} emptyMessage="No staff yet." />
      <Pagination meta={meta} basePath="/staff" extraParams={{ range_id: rangeId }} />
    </div>
  );
}
