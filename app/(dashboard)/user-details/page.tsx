import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { linkButtonClass } from "@/lib/ui-classes";
import { listUserDetails, type UserDetails } from "@/lib/resources/user-details";

export default async function UserDetailsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const { data: details, meta } = await listUserDetails(Number(page) || 1);

  const columns: Column<UserDetails>[] = [
    { header: "Full Name", render: (d) => <span className="font-medium text-zinc-900">{d.fullname}</span> },
    { header: "Mobile", render: (d) => d.mobile_number || <span className="text-zinc-400">—</span> },
    { header: "Email", render: (d) => d.email || <span className="text-zinc-400">—</span> },
    {
      header: "Actions",
      render: (d) => (
        <Link href={`/users/${d.user_id}/edit`} className={linkButtonClass}>
          Manage User
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">User Details</h1>
        <p className="text-sm text-zinc-500">
          Contact details for field users. Edit these from a user&apos;s Manage page.
        </p>
      </div>
      <DataTable columns={columns} rows={details} rowKey={(d) => d.id} emptyMessage="No contact details recorded yet." />
      <Pagination meta={meta} basePath="/user-details" />
    </div>
  );
}
