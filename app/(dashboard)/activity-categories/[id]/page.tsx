import { notFound } from "next/navigation";
import Link from "next/link";
import { getActivityCategory } from "@/lib/resources/activity-categories";
import { cardClass, linkButtonClass } from "@/lib/ui-classes";

export default async function ActivityCategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getActivityCategory(id).catch(() => null);
  if (!category) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/activity-categories" className="text-sm text-zinc-500 hover:underline">
            &larr; Activity Categories
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">{category.name}</h1>
        </div>
        {category.has_report && (
          <Link href={`/activity-categories/${id}/report-fields`} className={linkButtonClass}>
            Manage Report Fields
          </Link>
        )}
      </div>

      <div className={`space-y-3 p-4 ${cardClass}`}>
        {category.description && <p className="text-sm text-zinc-700">{category.description}</p>}
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Has Report" value={category.has_report ? "Yes" : "No"} />
          <Info
            label="Created By"
            value={category.created_by?.name || category.created_by?.employee_id || "—"}
          />
          <Info
            label="Created"
            value={
              category.created_at
                ? new Date(category.created_at).toLocaleString([], { timeZone: "Asia/Kolkata" })
                : "—"
            }
          />
        </dl>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{value}</dd>
    </div>
  );
}
