import { notFound } from "next/navigation";
import Link from "next/link";
import { getBeachCleaningActivity, getBeachCleaningReport } from "@/lib/resources/beach-cleaning-activities";
import { ReportContent } from "../../report/ReportContent";

/**
 * The same fixed country x waste-category report as the multi-drive report
 * page (`/beach-cleaning-activities/report`), scoped to this one drive via
 * `activity_id` — see `AdminBeachCleaningActivityController::report`. No
 * filter row (there's nothing to filter within a single drive); just the
 * summary, both tables, charts, and a PDF download, same as the overall
 * report.
 */
export default async function BeachCleaningActivityReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, report] = await Promise.all([
    getBeachCleaningActivity(id).catch(() => null),
    getBeachCleaningReport({ activityId: id }),
  ]);
  if (!activity) notFound();

  const activityDate = activity.created_at ? activity.created_at.slice(0, 10) : undefined;
  const rangerName = activity.officer?.name || activity.officer?.employee_id;

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/beach-cleaning-activities/${id}`} className="text-sm text-zinc-500 hover:underline">
          &larr; {activity.activity_name}
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Waste Segregation Report</h1>
        <p className="text-sm text-zinc-500">Fixed country × waste-category breakdown for this drive only.</p>
      </div>

      <ReportContent
        report={report}
        destinationName={activity.destination?.name}
        beachName={activity.beach?.name}
        rangerName={rangerName}
        dateFrom={activityDate}
        dateTo={activityDate}
      />
    </div>
  );
}
