/**
 * The fixed "Waste Segregation Format for Sample of 10% (Lot)" table shape
 * — every one of the 22 countries (rows), then TOTAL; every one of the 9
 * waste categories (columns), then No. of Bags — always fully populated: a
 * cell with nothing recorded shows `0`, never a blank. Used for both the
 * as-recorded 10% sample table and the estimated 100% table; which one a
 * given instance renders is just whichever `matrix`/`categoryTotals`/
 * `grandTotal` it's given.
 */
export function ReportTable({
  countries,
  categories,
  matrix,
  categoryTotals,
  grandTotal,
  totalBags,
  activityCount,
}: {
  countries: string[];
  categories: string[];
  matrix: Record<string, Record<string, number>>;
  categoryTotals: Record<string, number>;
  grandTotal: number;
  /** Only given for the as-recorded table — bags are a real count, not a sample, so the estimated table has none of its own. */
  totalBags?: number;
  activityCount: number;
}) {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-50">
              <th rowSpan={2} className={headerCellClass + " w-12"}>
                Sl. No
              </th>
              <th rowSpan={2} className={headerCellClass + " min-w-[110px] text-left"}>
                Country
              </th>
              {categories.map((category) => (
                <th key={category} className={headerCellClass + " min-w-[90px]"}>
                  {category}
                </th>
              ))}
              {totalBags !== undefined && (
                <th rowSpan={2} className={headerCellClass + " min-w-[80px]"}>
                  No. of Bags
                </th>
              )}
            </tr>
            <tr className="bg-zinc-50">
              {categories.map((category) => (
                <th key={category} className={headerCellClass + " font-normal text-zinc-500"}>
                  Nos.
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countries.map((country, index) => (
              <tr key={country} className={index % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                <td className={cellClass + " text-center text-zinc-500"}>{index + 1}</td>
                <td className={cellClass + " text-zinc-900"}>{country}</td>
                {categories.map((category) => (
                  <td key={category} className={cellClass + " text-right text-zinc-900"}>
                    {matrix[country]?.[category] ?? 0}
                  </td>
                ))}
                {totalBags !== undefined && <td className={cellClass + " text-right text-zinc-400"}>0</td>}
              </tr>
            ))}
            <tr className="bg-zinc-100 font-semibold text-zinc-900">
              <td className={cellClass}></td>
              <td className={cellClass}>TOTAL</td>
              {categories.map((category) => (
                <td key={category} className={cellClass + " text-right"}>
                  {categoryTotals[category] ?? 0}
                </td>
              ))}
              {totalBags !== undefined && <td className={cellClass + " text-right"}>{totalBags}</td>}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        {activityCount} drive{activityCount === 1 ? "" : "s"} · Grand total {grandTotal} Nos.
        {totalBags !== undefined &&
          " · No. of Bags is recorded per drive, not per country — shown here as a single total, not a per-row breakdown."}
      </p>
    </div>
  );
}

const headerCellClass = "border border-zinc-200 px-2 py-1.5 text-center font-semibold text-zinc-700 whitespace-nowrap";
const cellClass = "border border-zinc-200 px-2 py-1";
