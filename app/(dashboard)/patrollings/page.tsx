import Link from "next/link";
import { listActivity, listPatrollings, type PatrolStatus } from "@/lib/resources/patrollings";
import { listAllRanges } from "@/lib/resources/ranges";
import { PatrollingsTable } from "./PatrollingsTable";
import { ActivityTable } from "./ActivityTable";
import { RangeFilter } from "./RangeFilter";

const STATUS_TABS: { value: PatrolStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending", label: "Not Started" },
  { value: "completed", label: "Completed" },
];

type ActivityTypeFilter = "patrolling" | "case" | "all";

const TYPE_TABS: { value: ActivityTypeFilter; label: string }[] = [
  { value: "patrolling", label: "Patrolling" },
  { value: "case", label: "Case" },
  { value: "all", label: "All" },
];

export default async function PatrollingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; range?: string; type?: string }>;
}) {
  const { page, status, range, type } = await searchParams;
  const currentPage = Number(page) || 1;
  const currentStatus = (status as PatrolStatus | undefined) || undefined;
  const currentRangeId = range || undefined;
  const currentType: ActivityTypeFilter = (type as ActivityTypeFilter) || "patrolling";
  const ranges = await listAllRanges();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Patrollings</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {TYPE_TABS.map((tab) => {
            const active = currentType === tab.value;
            const params = new URLSearchParams();
            if (tab.value !== "patrolling") params.set("type", tab.value);
            if (tab.value === "patrolling" && currentStatus) params.set("status", currentStatus);
            if (currentRangeId) params.set("range", currentRangeId);
            const query = params.toString();
            const href = `/patrollings${query ? `?${query}` : ""}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <RangeFilter
          ranges={ranges}
          currentRangeId={currentRangeId}
          currentStatus={currentType === "patrolling" ? currentStatus : undefined}
          currentType={currentType !== "patrolling" ? currentType : undefined}
        />
      </div>

      {currentType === "patrolling" && (
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
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {currentType === "patrolling" ? (
        <PatrollingsSection page={currentPage} status={currentStatus} rangeId={currentRangeId} />
      ) : (
        <ActivitySection page={currentPage} type={currentType} rangeId={currentRangeId} />
      )}
    </div>
  );
}

async function PatrollingsSection({
  page,
  status,
  rangeId,
}: {
  page: number;
  status?: PatrolStatus;
  rangeId?: string;
}) {
  const listing = await listPatrollings(page, status, rangeId);
  return (
    <PatrollingsTable
      key={`${page}-${status ?? "all"}-${rangeId ?? "all"}`}
      initialData={listing}
      page={page}
      status={status}
      rangeId={rangeId}
    />
  );
}

async function ActivitySection({
  page,
  type,
  rangeId,
}: {
  page: number;
  type: "case" | "all";
  rangeId?: string;
}) {
  const listing = await listActivity(page, type, undefined, rangeId);
  return (
    <ActivityTable
      key={`${type}-${page}-${rangeId ?? "all"}`}
      initialData={listing}
      page={page}
      type={type}
      rangeId={rangeId}
    />
  );
}
