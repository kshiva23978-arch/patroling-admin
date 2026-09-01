import { DataTable, type Column } from "@/components/crud/DataTable";
import { Pagination } from "@/components/crud/Pagination";
import { ApiError } from "@/lib/api-client";
import { badgeClass, cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui-classes";
import { listLoginLogs, type LoginLog } from "@/lib/resources/login-logs";

type SearchParams = { page?: string; type?: string; successful?: string; employee_id?: string };

export default async function LoginLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { page, type, successful, employee_id: employeeId } = await searchParams;

  let logs: LoginLog[];
  let meta: Awaited<ReturnType<typeof listLoginLogs>>["meta"];
  try {
    ({ data: logs, meta } = await listLoginLogs({
      page: Number(page) || 1,
      type: type === "admin" || type === "user" ? type : undefined,
      successful: successful === "1" ? true : successful === "0" ? false : undefined,
      employeeId: employeeId || undefined,
    }));
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold text-zinc-900">Login Logs</h1>
          <div className={`p-6 text-sm text-zinc-600 ${cardClass}`}>
            This section is only accessible to a Master Admin (System Administrator).
          </div>
        </div>
      );
    }
    throw err;
  }

  const columns: Column<LoginLog>[] = [
    { header: "Employee ID", render: (l) => <span className="font-medium text-zinc-900">{l.employee_id}</span> },
    {
      header: "Account type",
      render: (l) => <span className="capitalize">{l.account_type === "admin" ? "Admin" : "Field user"}</span>,
    },
    { header: "Result", render: (l) => <span className={badgeClass(l.successful)}>{l.successful ? "Success" : "Failed"}</span> },
    { header: "IP address", render: (l) => l.ip_address ?? <span className="text-zinc-400">—</span> },
    {
      header: "User agent",
      render: (l) => (
        <span className="block max-w-xs truncate" title={l.user_agent ?? undefined}>
          {l.user_agent ?? <span className="text-zinc-400">—</span>}
        </span>
      ),
    },
    {
      header: "When",
      render: (l) => (l.created_at ? new Date(l.created_at).toLocaleString() : <span className="text-zinc-400">—</span>),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Login Logs</h1>
      </div>

      <form method="get" className={`grid grid-cols-1 gap-3 p-4 sm:grid-cols-4 ${cardClass}`}>
        <div>
          <label className={labelClass} htmlFor="employee_id">
            Employee ID
          </label>
          <input
            id="employee_id"
            name="employee_id"
            defaultValue={employeeId ?? ""}
            placeholder="Search employee ID"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="type">
            Account type
          </label>
          <select id="type" name="type" defaultValue={type ?? ""} className={inputClass}>
            <option value="">All</option>
            <option value="admin">Admin</option>
            <option value="user">Field user</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="successful">
            Result
          </label>
          <select id="successful" name="successful" defaultValue={successful ?? ""} className={inputClass}>
            <option value="">All</option>
            <option value="1">Success</option>
            <option value="0">Failed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className={primaryButtonClass}>
            Filter
          </button>
        </div>
      </form>

      <DataTable columns={columns} rows={logs} rowKey={(l) => l.id} emptyMessage="No login attempts recorded yet." />
      <Pagination
        meta={meta}
        basePath="/login-logs"
        extraParams={{ type, successful, employee_id: employeeId }}
      />
    </div>
  );
}
