import type { BeachCleaningWeightRow, BeachCleaningWeightSummary } from "@/lib/resources/beach-cleaning-activities";
import { cardClass } from "@/lib/ui-classes";

/**
 * Total collected weight (KG), by category and by destination, across every
 * drive matching the list page's current filters — see
 * `getBeachCleaningWeightSummary`. Skips itself entirely once there's
 * nothing weighed yet, same as the per-activity report tables would.
 */
export function WeightSummary({ summary }: { summary: BeachCleaningWeightSummary }) {
  if (summary.total_weight_kg === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <WeightTable title="Category-Wise Weight" rows={summary.by_category} />
      <WeightTable title="Destination-Wise Weight" rows={summary.by_destination} />
    </div>
  );
}

function WeightTable({ title, rows }: { title: string; rows: BeachCleaningWeightRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.weight_kg, 0);
  return (
    <div className={`space-y-2 p-4 ${cardClass}`}>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-400">No weight recorded.</p>
      ) : (
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1.5 pr-4 text-zinc-700">{row.name}</td>
                <td className="py-1.5 text-right font-medium text-zinc-900">{row.weight_kg.toFixed(1)} kg</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-200">
              <td className="py-1.5 pr-4 text-right font-semibold text-zinc-900">Total</td>
              <td className="py-1.5 text-right font-semibold text-zinc-900">{total.toFixed(1)} kg</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
