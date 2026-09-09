import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { primaryButtonClass, linkButtonClass } from "@/lib/ui-classes";
import { listCountries, type Country } from "@/lib/resources/countries";
import { deleteCountryAction } from "./actions";

export default async function CountriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: countries, meta } = await listCountries(Number(page) || 1);

  const columns: Column<Country>[] = [
    { header: "Country Name", render: (c) => <span className="font-medium text-zinc-900">{c.country_name}</span> },
    {
      header: "Actions",
      render: (c) => (
        <div className="flex gap-2">
          <Link href={`/countries/${c.id}/edit`} className={linkButtonClass}>
            Edit
          </Link>
          <ConfirmDeleteButton
            action={deleteCountryAction.bind(null, c.id)}
            confirmMessage={`Delete country "${c.country_name}"?`}
            successMessage="Country deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Countries</h1>
        <Link href="/countries/new" className={primaryButtonClass}>
          New Country
        </Link>
      </div>
      <DataTable columns={columns} rows={countries} rowKey={(c) => c.id} emptyMessage="No countries yet." />
      <Pagination meta={meta} basePath="/countries" />
    </div>
  );
}
