import { notFound } from "next/navigation";
import Link from "next/link";
import { getActivityCategory } from "@/lib/resources/activity-categories";
import { listReportFields } from "@/lib/resources/activity-report-fields";
import { ReportFieldsManager } from "./ReportFieldsManager";

export default async function ReportFieldsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getActivityCategory(id).catch(() => null);
  if (!category) notFound();

  const { groups, fields } = await listReportFields(id);

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/activity-categories/${id}`} className="text-sm text-zinc-500 hover:underline">
          &larr; {category.name}
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900">Report Fields — {category.name}</h1>
      </div>

      {!category.has_report ? (
        <p className="text-sm text-zinc-500">
          This category doesn&apos;t collect a report — enable &quot;Has Report&quot; on the category to add fields.
        </p>
      ) : (
        <ReportFieldsManager categoryId={id} groups={groups} fields={fields} />
      )}
    </div>
  );
}
