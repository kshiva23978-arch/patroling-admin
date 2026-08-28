import Link from "next/link";
import { getCaseEntry } from "@/lib/resources/case-entries";
import { badgeClass, cardClass, linkButtonClass } from "@/lib/ui-classes";

export default async function CaseEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getCaseEntry(id);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{c.case_number}</h1>
          <p className="text-sm text-zinc-500">{c.case_type}</p>
        </div>
        <Link href="/case-entries" className={linkButtonClass}>
          Back to Cases
        </Link>
      </div>

      <div className={`grid grid-cols-2 gap-4 p-6 text-sm ${cardClass}`}>
        <div>
          <p className="text-xs font-medium text-zinc-500">Status</p>
          <span className={badgeClass(c.status === "completed")}>{c.status.replace("_", " ")}</span>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Date</p>
          <p className="text-zinc-900">{c.date ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Range</p>
          <p className="text-zinc-900">{c.range?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Beat</p>
          <p className="text-zinc-900">{c.beat?.name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Leader</p>
          <p className="text-zinc-900">{c.leader?.name ?? c.leader?.employee_id ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Area Covered</p>
          <p className="text-zinc-900">{c.area_covered ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Start Time</p>
          <p className="text-zinc-900">{c.start_time ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">End Time</p>
          <p className="text-zinc-900">{c.end_time ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
