import Link from "next/link";
import {
  getPatrolReport,
  getPatrolReportOptions,
  type PatrolReportFilters,
  type PatrolStatus,
} from "@/lib/resources/patrollings";
import { listAllRanges } from "@/lib/resources/ranges";
import { ReportFilters } from "./ReportFilters";
import { ReportContent } from "./ReportContent";

type Param = string | string[] | undefined;

/** Repeated query params arrive as an array, a single one as a string. */
const toList = (value: Param) => (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);

const YES_NO = ["yes", "no"] as const;
const STATUSES: PatrolStatus[] = ["pending", "in_progress", "completed"];

/**
 * Admin "Patrol Report": filter patrols by range, staff deployed, whether
 * a case/incident was recorded, status and date window — every filter a
 * multi-select, nothing selected meaning all — then see totals, one map
 * with every matching trail, and a per-patrol table, with a PDF download.
 * The selection lives in the URL (repeated params) so a generated report
 * is bookmarkable/shareable, same as the beach-cleaning report.
 */
export default async function PatrolReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    range_id?: Param;
    staff?: Param;
    case_recorded?: Param;
    incident_recorded?: Param;
    status?: Param;
    date_from?: string;
    date_to?: string;
  }>;
}) {
  const params = await searchParams;
  const rangeIds = toList(params.range_id);
  const staffNames = toList(params.staff);
  const caseRecorded = toList(params.case_recorded).filter((v): v is "yes" | "no" => (YES_NO as readonly string[]).includes(v));
  const incidentRecorded = toList(params.incident_recorded).filter((v): v is "yes" | "no" =>
    (YES_NO as readonly string[]).includes(v),
  );
  const statuses = toList(params.status).filter((v): v is PatrolStatus => (STATUSES as string[]).includes(v));
  const dateFrom = params.date_from || undefined;
  const dateTo = params.date_to || undefined;

  const filters: PatrolReportFilters = {
    rangeIds: rangeIds.length ? rangeIds : undefined,
    staffNames: staffNames.length ? staffNames : undefined,
    caseRecorded: caseRecorded.length ? caseRecorded : undefined,
    incidentRecorded: incidentRecorded.length ? incidentRecorded : undefined,
    statuses: statuses.length ? statuses : undefined,
    dateFrom,
    dateTo,
  };

  const [report, ranges, options] = await Promise.all([
    getPatrolReport(filters),
    listAllRanges(),
    getPatrolReportOptions(),
  ]);

  const rangeNames = rangeIds.map((id) => ranges.find((r) => r.id === id)?.range_name).filter((n): n is string => Boolean(n));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/patrollings" className="text-sm text-zinc-500 hover:underline">
          &larr; Patrollings
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Patrol Report</h1>
        <p className="text-sm text-zinc-500">
          Patrols matching the filters below — totals, every route on one map, and a per-patrol breakdown.
        </p>
      </div>

      <ReportFilters
        ranges={ranges}
        staffOptions={options.staff_names}
        current={{ rangeIds, staffNames, caseRecorded, incidentRecorded, statuses, dateFrom, dateTo }}
      />

      <ReportContent
        report={report}
        labels={{
          ranges: rangeNames.length ? rangeNames.join(", ") : "All Ranges",
          staff: staffNames.length ? staffNames.join(", ") : "All Staff",
          caseRecorded: yesNoLabel(caseRecorded, "case"),
          incidentRecorded: yesNoLabel(incidentRecorded, "incident"),
          statuses: statuses.length ? statuses.map(statusLabel).join(", ") : "All Statuses",
          dateRange: dateFrom || dateTo ? `${dateFrom || "…"} to ${dateTo || "…"}` : "All Dates",
        }}
      />
    </div>
  );
}

function yesNoLabel(values: ("yes" | "no")[], noun: string): string {
  const unique = Array.from(new Set(values));
  if (unique.length !== 1) return "Any";
  return unique[0] === "yes" ? `With ${noun}` : `Without ${noun}`;
}

function statusLabel(status: PatrolStatus): string {
  return status === "in_progress" ? "In Progress" : status === "completed" ? "Completed" : "Not Started";
}
