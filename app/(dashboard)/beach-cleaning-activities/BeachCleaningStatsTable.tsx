import { DataTable, type Column } from "@/components/crud/DataTable";
import type { BeachCleaningBeachStat } from "@/lib/resources/beach-cleaning-activities";

export function BeachCleaningStatsTable({ stats }: { stats: BeachCleaningBeachStat[] }) {
  const columns: Column<BeachCleaningBeachStat>[] = [
    {
      header: "Beach",
      render: (s) => (
        <span className="font-medium text-zinc-900">{s.beach?.name ?? "Unassigned"}</span>
      ),
    },
    {
      header: "Destination",
      render: (s) => s.destination?.name ?? <span className="text-zinc-400">—</span>,
    },
    {
      header: "Drives",
      render: (s) => s.activities_count,
    },
    {
      header: "Participants",
      render: (s) => s.participant_count,
    },
    {
      header: "Bags",
      render: (s) => s.bags_collected,
    },
    {
      header: "Weight (kg)",
      render: (s) => s.total_weight_kg.toFixed(1),
    },
    {
      header: "Avg. Segregation %",
      render: (s) => (s.avg_segregation_percent !== null ? `${s.avg_segregation_percent.toFixed(1)}%` : <span className="text-zinc-400">—</span>),
    },
  ];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900">Beach-wise Collection Stats</h2>
      <DataTable
        columns={columns}
        rows={stats}
        rowKey={(s) => s.beach?.id ?? "unassigned"}
        emptyMessage="No collection stats yet."
      />
    </div>
  );
}
