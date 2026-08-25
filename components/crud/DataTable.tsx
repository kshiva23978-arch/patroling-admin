import type { ReactNode } from "react";
import { cardClass } from "@/lib/ui-classes";

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage = "No records found." }: DataTableProps<T>) {
  return (
    <div className={`overflow-x-auto ${cardClass}`}>
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-zinc-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-zinc-50">
                {columns.map((col) => (
                  <td key={col.header} className={`whitespace-nowrap px-4 py-2.5 text-sm text-zinc-700 ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
