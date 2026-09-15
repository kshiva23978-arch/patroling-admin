import Link from "next/link";
import {
  getBeachCleaningReport,
  listBeachCleaningRangers,
  type BeachCleaningReportFilters,
} from "@/lib/resources/beach-cleaning-activities";
import { listAllDestinations } from "@/lib/resources/destinations";
import { listAllBeaches } from "@/lib/resources/beaches";
import { listAllCountries } from "@/lib/resources/countries";
import { ReportFilters } from "./ReportFilters";
import { ReportContent } from "./ReportContent";

export default async function BeachCleaningReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    /** Repeated once per selected destination/beach (`?destination_id=a&destination_id=b`). */
    destination_id?: string | string[];
    beach_id?: string | string[];
    created_by?: string;
    country_id?: string;
    date_from?: string;
    date_to?: string;
  }>;
}) {
  const {
    destination_id: destinationId,
    beach_id: beachId,
    created_by: createdBy,
    country_id: countryId,
    date_from: dateFrom,
    date_to: dateTo,
  } = await searchParams;

  const toList = (value?: string | string[]) => (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);
  const destinationIds = toList(destinationId);
  const beachIds = toList(beachId);

  const filters: BeachCleaningReportFilters = {
    destinationIds: destinationIds.length > 0 ? destinationIds : undefined,
    beachIds: beachIds.length > 0 ? beachIds : undefined,
    createdBy: createdBy || undefined,
    countryId: countryId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const [report, destinations, beaches, rangers, countries] = await Promise.all([
    getBeachCleaningReport(filters),
    listAllDestinations(),
    listAllBeaches(),
    listBeachCleaningRangers(),
    listAllCountries(),
  ]);

  // Comma-joined labels for the summary card / PDF header — `undefined`
  // when nothing is selected so those fall back to "All …".
  const namesFor = <T extends { id: string; name: string }>(items: T[], ids: string[]) => {
    const names = ids.map((id) => items.find((i) => i.id === id)?.name).filter((n): n is string => Boolean(n));
    return names.length > 0 ? names.join(", ") : undefined;
  };
  const destinationName = namesFor(destinations, destinationIds);
  const beachName = namesFor(beaches, beachIds);
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
        countries={countries}
        currentDestinationIds={destinationIds}
        currentBeachIds={beachIds}
        currentRangerId={filters.createdBy}
        currentCountryId={filters.countryId}
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
