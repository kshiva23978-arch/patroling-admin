import Link from "next/link";
import { listPatrollings, type PatrolStatus } from "@/lib/resources/patrollings";
import { listAllRanges } from "@/lib/resources/ranges";
import { PatrollingsTable } from "./PatrollingsTable";
import { RangeFilter } from "./RangeFilter";

const STATUS_TABS: { value: PatrolStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Not Started" },
  { value: "completed", label: "Completed" },
];

export default async function PatrollingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; range?: string }>;
}) {
  const { page, status, range } = await searchParams;
  const currentPage = Number(page) || 1;
  const currentStatus = (status as PatrolStatus | undefined) || undefined;
  const currentRangeId = range || undefined;

  const [patrollings, ranges] = await Promise.all([
    listPatrollings(currentPage, currentStatus, currentRangeId),
    listAllRanges(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Patrollings</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => {
            const active = (currentStatus ?? "all") === tab.value;
            const params = new URLSearchParams();
            if (tab.value !== "all") params.set("status", tab.value);
            if (currentRangeId) params.set("range", currentRangeId);
            const query = params.toString();
            const href = `/patrollings${query ? `?${query}` : ""}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <RangeFilter ranges={ranges} currentRangeId={currentRangeId} currentStatus={currentStatus} />
      </div>

      <PatrollingsTable
        key={`${currentPage}-${currentStatus ?? "all"}-${currentRangeId ?? "all"}`}
        initialData={patrollings}
        page={currentPage}
        status={currentStatus}
        rangeId={currentRangeId}
      />
    </div>
  );
}
