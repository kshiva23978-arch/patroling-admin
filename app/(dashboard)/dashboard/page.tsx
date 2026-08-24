import { getDashboardStats } from "@/lib/resources/dashboard";
import { listAllRanges } from "@/lib/resources/ranges";
import { cardClass } from "@/lib/ui-classes";
import { DashboardFilters } from "./DashboardFilters";

const TILES: { key: keyof Awaited<ReturnType<typeof getDashboardStats>>; label: string }[] = [
  { key: "ranges", label: "No. of Ranges" },
  { key: "patrollings", label: "No. of Patrollings" },
  { key: "beats", label: "Total Beats" },
  { key: "cases", label: "Total Cases" },
  { key: "incidents", label: "Total Incidents" },
  { key: "live_patrollings", label: "Live Patrollings" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { range, from, to } = await searchParams;
  const currentRangeId = range || undefined;
  const currentFrom = from || undefined;
  const currentTo = to || undefined;

  const [stats, ranges] = await Promise.all([
    getDashboardStats({ rangeId: currentRangeId, from: currentFrom, to: currentTo }),
    listAllRanges(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>

      <DashboardFilters
        ranges={ranges}
        currentRangeId={currentRangeId}
        currentFrom={currentFrom}
        currentTo={currentTo}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map((tile) => (
          <div key={tile.key} className={`p-5 ${cardClass}`}>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{tile.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {stats[tile.key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
