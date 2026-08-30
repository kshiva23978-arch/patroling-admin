import Link from "next/link";
import { listCaseEntries, type CaseEntry, type CaseStatus } from "@/lib/resources/case-entries";
import { listAllRanges } from "@/lib/resources/ranges";
import { Pagination } from "@/components/crud/Pagination";
import { ConfirmDeleteButton } from "@/components/crud/ConfirmDeleteButton";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { badgeClass, linkButtonClass } from "@/lib/ui-classes";
import { RangeFilter } from "./range-filter";
import { deleteCaseEntryAction } from "./actions";

const STATUS_TABS: { value: CaseStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Not Started" },
  { value: "completed", label: "Completed" },
];

export default async function CaseEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; range?: string }>;
}) {
  const { page, status, range } = await searchParams;
  const currentPage = Number(page) || 1;
  const currentStatus = (status as CaseStatus | undefined) || undefined;
  const currentRangeId = range || undefined;

  const [ranges, listing] = await Promise.all([
    listAllRanges(),
    listCaseEntries(currentPage, currentStatus, currentRangeId),
  ]);

  const columns: Column<CaseEntry>[] = [
    {
      header: "Case #",
      render: (c) => (
        <Link href={`/case-entries/${c.id}`} className="font-medium text-green-700 hover:underline">
          {c.case_number}
        </Link>
      ),
    },
    {
      header: "Status",
      render: (c) => <span className={badgeClass(c.status === "completed")}>{c.status.replace("_", " ")}</span>,
    },
    {
      header: "Range",
      render: (c) => c.range?.name ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Beat",
      render: (c) => c.beat?.name ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Leader",
      render: (c) => c.leader?.name ?? c.leader?.employee_id ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Date",
      render: (c) => c.date ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Actions",
      render: (c) => (
        <div className="flex gap-2">
          <Link href={`/case-entries/${c.id}`} className={linkButtonClass}>
            Track
          </Link>
          <ConfirmDeleteButton
            action={deleteCaseEntryAction.bind(null, c.id)}
            confirmMessage={`Delete case "${c.case_number}"? This also removes its incidents, filings, route history, and photos. This cannot be undone.`}
            successMessage="Case deleted."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Cases</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => {
            const active = (currentStatus ?? "all") === tab.value;
            const params = new URLSearchParams();
            if (tab.value !== "all") params.set("status", tab.value);
            if (currentRangeId) params.set("range", currentRangeId);
            const query = params.toString();
            const href = `/case-entries${query ? `?${query}` : ""}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-zinc-900 text-white" : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <RangeFilter ranges={ranges} currentRangeId={currentRangeId} currentStatus={currentStatus} />
      </div>

      <DataTable columns={columns} rows={listing.data} rowKey={(c) => c.id} emptyMessage="No cases found." />

      <Pagination meta={listing.meta} basePath="/case-entries" extraParams={{ status: currentStatus, range: currentRangeId }} />
    </div>
  );
}
