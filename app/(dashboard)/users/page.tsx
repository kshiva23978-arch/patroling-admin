import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listUsers, type FieldUser } from "@/lib/resources/users";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const [{ data: users, meta }, roles, designations] = await Promise.all([
    listUsers(Number(page) || 1),
    listAllRoles(),
    listAllDesignations(),
  ]);
  const roleName = new Map(roles.map((r) => [r.id, r.name]));
  const designationName = new Map(designations.map((d) => [d.id, d.designation_name]));

  const columns: Column<FieldUser>[] = [
    { header: "Employee ID", render: (u) => <span className="font-medium text-zinc-900">{u.employee_id}</span> },
    { header: "Role", render: (u) => (u.role ? roleName.get(u.role) ?? u.role : <span className="text-zinc-400">—</span>) },
    {
      header: "Designation",
      render: (u) => (u.designation ? designationName.get(u.designation) ?? u.designation : <span className="text-zinc-400">—</span>),
    },
    { header: "Status", render: (u) => <span className={badgeClass(u.status)}>{u.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (u) => (
        <Link href={`/users/${u.id}/edit`} className={linkButtonClass}>
          Manage
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Field Users</h1>
        <Link href="/users/new" className={primaryButtonClass}>
          New Field User
        </Link>
      </div>
      <DataTable columns={columns} rows={users} rowKey={(u) => u.id} emptyMessage="No field users yet." />
      <Pagination meta={meta} basePath="/users" />
    </div>
  );
}
