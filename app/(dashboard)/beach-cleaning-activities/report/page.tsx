import Link from "next/link";
import {
  getBeachCleaningReport,
  listBeachCleaningRangers,
  type BeachCleaningReportFilters,
} from "@/lib/resources/beach-cleaning-activities";
import { listAllDestinations } from "@/lib/resources/destinations";
import { listAllBeaches } from "@/lib/resources/beaches";
import { ReportFilters } from "./ReportFilters";
import { ReportContent } from "./ReportContent";

export default async function BeachCleaningReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    destination_id?: string;
    beach_id?: string;
    created_by?: string;
    date_from?: string;
    date_to?: string;
  }>;
}) {
  const {
    destination_id: destinationId,
    beach_id: beachId,
    created_by: createdBy,
    date_from: dateFrom,
    date_to: dateTo,
  } = await searchParams;

  const filters: BeachCleaningReportFilters = {
    destinationId: destinationId || undefined,
    beachId: beachId || undefined,
    createdBy: createdBy || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const [report, destinations, beaches, rangers] = await Promise.all([
    getBeachCleaningReport(filters),
    listAllDestinations(),
    listAllBeaches(),
    listBeachCleaningRangers(),
  ]);

  const destinationName = destinations.find((d) => d.id === filters.destinationId)?.name;
  const beachName = beaches.find((b) => b.id === filters.beachId)?.name;
  const rangerOption = rangers.find((r) => r.id === filters.createdBy);
  const rangerName = rangerOption ? rangerOption.name || rangerOption.employee_id : undefined;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/beach-cleaning-activities" className="text-sm text-zinc-500 hover:underline">
          &larr; Beach Cleaning
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Waste Segregation Report</h1>
        <p className="text-sm text-zinc-500">Fixed country × waste-category breakdown, same shape as the paper form.</p>
      </div>

      <ReportFilters
        destinations={destinations}
        beaches={beaches}
        rangers={rangers}
        currentDestinationId={filters.destinationId}
        currentBeachId={filters.beachId}
        currentRangerId={filters.createdBy}
        currentDateFrom={filters.dateFrom}
        currentDateTo={filters.dateTo}
      />

      <ReportContent
        report={report}
        destinationName={destinationName}
        beachName={beachName}
        rangerName={rangerName}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
      />
    </div>
  );
}
