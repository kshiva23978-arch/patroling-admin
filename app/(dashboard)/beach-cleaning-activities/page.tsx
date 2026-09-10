import Link from "next/link";
import { listBeachCleaningActivities, listBeachCleaningRangers, getBeachCleaningStats } from "@/lib/resources/beach-cleaning-activities";
import type { BeachCleaningStatus } from "@/lib/resources/beach-cleaning-activities";
import { listAllDestinations } from "@/lib/resources/destinations";
import { listAllBeaches } from "@/lib/resources/beaches";
import { linkButtonClass } from "@/lib/ui-classes";
import { BeachCleaningActivitiesTable } from "./BeachCleaningActivitiesTable";
import { BeachCleaningFilters } from "./BeachCleaningFilters";
import { BeachCleaningStatsTable } from "./BeachCleaningStatsTable";

const STATUS_TABS: { value: BeachCleaningStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
];

export default async function BeachCleaningActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    destination_id?: string;
    beach_id?: string;
    created_by?: string;
  }>;
}) {
  const { page, status, destination_id: destinationId, beach_id: beachId, created_by: createdBy } =
    await searchParams;
  const currentPage = Number(page) || 1;
  const currentStatus = (status as BeachCleaningStatus | undefined) || undefined;

  const filters = {
    status: currentStatus,
    destinationId: destinationId || undefined,
    beachId: beachId || undefined,
    createdBy: createdBy || undefined,
  };

  const [listing, destinations, beaches, rangers, beachStats] = await Promise.all([
    listBeachCleaningActivities(currentPage, filters),
    listAllDestinations(),
    listAllBeaches(),
    listBeachCleaningRangers(),
    getBeachCleaningStats(filters),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Beach Cleaning</h1>
        <Link href="/beach-cleaning-activities/report" className={linkButtonClass}>
          Generate Report
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => {
            const active = (currentStatus ?? "all") === tab.value;
            const params = new URLSearchParams();
            if (tab.value !== "all") params.set("status", tab.value);
            if (filters.destinationId) params.set("destination_id", filters.destinationId);
            if (filters.beachId) params.set("beach_id", filters.beachId);
            if (filters.createdBy) params.set("created_by", filters.createdBy);
            const query = params.toString();
            const href = `/beach-cleaning-activities${query ? `?${query}` : ""}`;
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

        <BeachCleaningFilters
          destinations={destinations}
          beaches={beaches}
          rangers={rangers}
          currentDestinationId={filters.destinationId}
          currentBeachId={filters.beachId}
          currentRangerId={filters.createdBy}
          currentStatus={currentStatus}
        />
      </div>

      <BeachCleaningStatsTable stats={beachStats} />

      <BeachCleaningActivitiesTable data={listing} filters={filters} />
    </div>
  );
}
