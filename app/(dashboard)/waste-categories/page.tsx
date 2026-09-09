import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { listWasteCategories, type WasteCategory } from "@/lib/resources/waste-categories";
import { deleteWasteCategoryAction } from "./actions";

export default async function WasteCategoriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: categories, meta } = await listWasteCategories(Number(page) || 1);

  const columns: Column<WasteCategory>[] = [
    { header: "Name", render: (c) => <span className="font-medium text-zinc-900">{c.name}</span> },
    { header: "Status", render: (c) => <span className={badgeClass(c.status)}>{c.status ? "Active" : "Inactive"}</span> },
    {
      header: "Actions",
      render: (c) => (
        <div className="flex gap-2">
          <Link href={`/waste-categories/${c.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteWasteCategoryAction.bind(null, c.id)}
            confirmMessage={`Delete waste category "${c.name}"?`}
            successMessage="Waste category deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Waste Categories</h1>
        <Link href="/waste-categories/new" className={primaryButtonClass}>
          New Waste Category
        </Link>
      </div>
      <DataTable columns={columns} rows={categories} rowKey={(c) => c.id} emptyMessage="No waste categories yet." />
      <Pagination meta={meta} basePath="/waste-categories" />
    </div>
  );
}
