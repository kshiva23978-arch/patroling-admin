import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listAdmins, type Admin } from "@/lib/resources/admins";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { getCurrentAdmin } from "@/lib/auth";
import { deleteAdminAction } from "./actions";

export default async function AdminsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const [{ data: admins, meta }, roles, designations, currentAdmin] = await Promise.all([
    listAdmins(Number(page) || 1),
    listAllRoles(),
    listAllDesignations(),
    getCurrentAdmin(),
  ]);
  const roleName = new Map(roles.map((r) => [r.id, r.name]));
  const designationName = new Map(designations.map((d) => [d.id, d.designation_name]));

  const columns: Column<Admin>[] = [
    { header: "Employee ID", render: (a) => <span className="font-medium text-zinc-900">{a.employee_id}</span> },
    { header: "Role", render: (a) => (a.role ? roleName.get(a.role) ?? a.role : <span className="text-zinc-400">—</span>) },
    {
      header: "Designation",
      render: (a) => (a.designation ? designationName.get(a.designation) ?? a.designation : <span className="text-zinc-400">—</span>),
    },
    { header: "Status", render: (a) => <span className={badgeClass(a.status)}>{a.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (a) => (
        <div className="flex gap-2">
          <Link href={`/admins/${a.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          {a.id !== currentAdmin?.a_id && (
            <ConfirmDeleteButton
              action={deleteAdminAction.bind(null, a.id)}
              confirmMessage={`Delete admin "${a.employee_id}"?`}
              successMessage="Admin deleted."
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Admins</h1>
        <Link href="/admins/new" className={primaryButtonClass}>
          New Admin
        </Link>
      </div>
      <DataTable columns={columns} rows={admins} rowKey={(a) => a.id} emptyMessage="No admins yet." />
      <Pagination meta={meta} basePath="/admins" />
    </div>
  );
}
