import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listPatrolTypes, type PatrolType } from "@/lib/resources/patrol-types";
import { deletePatrolTypeAction } from "./actions";

export default async function PatrolTypesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: types, meta } = await listPatrolTypes(Number(page) || 1);

  const columns: Column<PatrolType>[] = [
    { header: "Name", render: (t) => <span className="font-medium text-zinc-900">{t.name}</span> },
    {
      header: "Categories",
      render: (t) =>
        t.categories.length ? (
          <div className="flex flex-wrap gap-1">
            {t.categories.map((c) => (
              <span key={c} className={badgeClass(true)}>
                {c}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-zinc-400">All categories</span>
        ),
    },
    { header: "Status", render: (t) => <span className={badgeClass(t.status)}>{t.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (t) => (
        <div className="flex gap-2">
          <Link href={`/patrol-types/${t.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deletePatrolTypeAction.bind(null, t.id)}
            confirmMessage={`Delete patrol type "${t.name}"?`}
            successMessage="Patrol type deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Patrol Types</h1>
        <Link href="/patrol-types/new" className={primaryButtonClass}>
          New Patrol Type
        </Link>
      </div>
      <DataTable columns={columns} rows={types} rowKey={(t) => t.id} emptyMessage="No patrol types yet." />
      <Pagination meta={meta} basePath="/patrol-types" />
    </div>
  );
}
