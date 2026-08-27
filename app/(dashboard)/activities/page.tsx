import Link from "next/link";
import { listActivities, type ActivityStatus } from "@/lib/resources/activities";
import { ActivitiesTable } from "./ActivitiesTable";

const STATUS_TABS: { value: ActivityStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page, status } = await searchParams;
  const currentPage = Number(page) || 1;
  const currentStatus = (status as ActivityStatus | undefined) || undefined;
  const listing = await listActivities(currentPage, currentStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Activities</h1>
      </div>

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => {
          const active = (currentStatus ?? "all") === tab.value;
          const params = new URLSearchParams();
          if (tab.value !== "all") params.set("status", tab.value);
          const query = params.toString();
          const href = `/activities${query ? `?${query}` : ""}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <ActivitiesTable data={listing} status={currentStatus} />
    </div>
  );
}
