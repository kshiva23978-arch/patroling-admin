"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { linkButtonClass } from "@/lib/ui-classes";
import { patrolStatusBadgeClass, patrolStatusLabel } from "@/lib/patrol-status";
import { fetchPatrollingsAction } from "./actions";
import type { Paginated } from "@/lib/api-client";
import type { Patrolling, PatrolStatus } from "@/lib/resources/patrollings";

const POLL_INTERVAL_MS = 15_000;

/**
 * Renders the live-polling patrol list. The caller must pass a `key` that
 * changes with `page`/`status` (see page.tsx) so navigating remounts this
 * component fresh with the new `initialData`, rather than needing an effect
 * to sync state from props.
 */
export function PatrollingsTable({
  initialData,
  page,
  status,
  rangeId,
}: {
  initialData: Paginated<Patrolling>;
  page: number;
  status?: PatrolStatus;
  rangeId?: string;
}) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setData(await fetchPatrollingsAction(page, status, rangeId));
      } catch {
        // Transient failure — the next tick will retry.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [page, status, rangeId]);

  const columns: Column<Patrolling>[] = [
    {
      header: "Patrol ID",
      render: (p) => <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.patrol_id}</span>,
    },
    {
      header: "Ranger",
      render: (p) => p.patrol_leader?.name || p.patrol_leader?.employee_id || <span className="text-zinc-400">—</span>,
    },
    {
      header: "Range / Beat",
      render: (p) => [p.range?.name, p.beat?.name].filter(Boolean).join(" / ") || <span className="text-zinc-400">—</span>,
    },
    {
      header: "Status",
      render: (p) => <span className={patrolStatusBadgeClass(p.status)}>{patrolStatusLabel(p.status)}</span>,
    },
    { header: "Date", render: (p) => `${p.date} • ${p.start_time}` },
    {
      header: "Traveling By",
      render: (p) =>
        p.current_travel_mode === "walking"
          ? "Walking"
          : (p.vehicles.find((v) => v.is_current)?.registration_no ?? <span className="text-zinc-400">—</span>),
    },
    {
      header: "Actions",
      render: (p) => (
        <Link href={`/patrollings/${p.id}`} className={linkButtonClass}>
          Track
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable columns={columns} rows={data.data} rowKey={(p) => p.id} emptyMessage="No patrols yet." />
      <Pagination meta={data.meta} basePath="/patrollings" extraParams={{ status, range: rangeId }} />
    </div>
  );
}
