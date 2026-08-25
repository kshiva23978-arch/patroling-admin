import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listRoles, type Role } from "@/lib/resources/roles";
import { deleteRoleAction } from "./actions";

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: roles, meta } = await listRoles(Number(page) || 1);

  const columns: Column<Role>[] = [
    { header: "Name", render: (r) => <span className="font-medium text-zinc-900">{r.name}</span> },
    { header: "Description", render: (r) => r.description || <span className="text-zinc-400">—</span> },
    { header: "Status", render: (r) => <span className={badgeClass(r.status)}>{r.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <Link href={`/roles/${r.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteRoleAction.bind(null, r.id)}
            confirmMessage={`Delete role "${r.name}"?`}
            successMessage="Role deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Roles</h1>
        <Link href="/roles/new" className={primaryButtonClass}>
          New Role
        </Link>
      </div>
      <DataTable columns={columns} rows={roles} rowKey={(r) => r.id} emptyMessage="No roles yet." />
      <Pagination meta={meta} basePath="/roles" />
    </div>
  );
}
