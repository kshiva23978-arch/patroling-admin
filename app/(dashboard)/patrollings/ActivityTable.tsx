"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { linkButtonClass } from "@/lib/ui-classes";
import { patrolStatusBadgeClass, patrolStatusLabel } from "@/lib/patrol-status";
import { fetchActivityAction } from "./actions";
import type { Paginated } from "@/lib/api-client";
import type { ActivityRow, PatrolStatus } from "@/lib/resources/patrollings";

const POLL_INTERVAL_MS = 15_000;

const TYPE_BADGE_CLASS: Record<ActivityRow["type"], string> = {
  patrolling: "inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  case: "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300",
};

const TYPE_LABEL: Record<ActivityRow["type"], string> = {
  patrolling: "Patrolling",
  case: "Case",
};

function statusBadge(row: ActivityRow) {
  if (row.type === "patrolling") {
    const status = row.status as PatrolStatus;
    return <span className={patrolStatusBadgeClass(status)}>{patrolStatusLabel(status)}</span>;
  }

  const isOpen = row.status === "open";
  const className = isOpen
    ? "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
    : "inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return <span className={className}>{isOpen ? "Open" : "Closed"}</span>;
}

/**
 * Live-polling table for the "Case" and "All" type views — a flattened
 * patrolling + case listing (see `AdminPatrolEntryController::indexUnified`).
 * The caller must pass a `key` that changes with `page`/`type`/`status` (see
 * page.tsx) so navigating remounts this component fresh with the new
 * `initialData`.
 */
export function ActivityTable({
  initialData,
  page,
  type,
  status,
  rangeId,
}: {
  initialData: Paginated<ActivityRow>;
  page: number;
  type: "case" | "all";
  status?: PatrolStatus;
  rangeId?: string;
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setData(await fetchActivityAction(page, type, status, rangeId));
      } catch {
        // Transient failure — the next tick will retry.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [page, type, status, rangeId]);

  const columns: Column<ActivityRow>[] = [
    {
      header: "Type",
      render: (row) => <span className={TYPE_BADGE_CLASS[row.type]}>{TYPE_LABEL[row.type]}</span>,
    },
    {
      header: "Reference",
      render: (row) => <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.reference}</span>,
    },
    {
      header: "Ranger",
      render: (row) => row.leader_name || row.leader_employee_id || <span className="text-zinc-400">—</span>,
    },
    {
      header: "Range / Beat",
      render: (row) => [row.range_name, row.beat_name].filter(Boolean).join(" / ") || <span className="text-zinc-400">—</span>,
    },
    { header: "Status", render: statusBadge },
    { header: "Date", render: (row) => row.date || <span className="text-zinc-400">—</span> },
    {
      header: "Actions",
      render: (row) => (
        <Link href={`/patrollings/${row.entry_id}`} className={linkButtonClass}>
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={data.data} rowKey={(row) => `${row.type}-${row.id}`} emptyMessage="Nothing recorded yet." />
      <Pagination meta={data.meta} basePath="/patrollings" extraParams={{ type, status, range: rangeId }} />
    </div>
  );
}
