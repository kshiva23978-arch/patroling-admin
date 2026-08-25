import { listAllRanges } from "@/lib/resources/ranges";
import { listCustomFields } from "@/lib/resources/custom-fields";
import { cardClass, inputClass, linkButtonClass } from "@/lib/ui-classes";
import { CustomFieldsManager } from "./CustomFieldsManager";

export default async function CustomFieldsPage({
  searchParams,
}: {
  searchParams: Promise<{ range_id?: string }>;
}) {
  const { range_id: rangeId } = await searchParams;
  const ranges = await listAllRanges();
  const selectedRangeId = rangeId || ranges[0]?.id;
  const fields = selectedRangeId ? await listCustomFields(selectedRangeId) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Custom Fields</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Define extra fields per range/category — they show up automatically on that range&apos;s patrol report
          form in the field app.
        </p>
      </div>

      <form method="get" className="flex items-end gap-2">
        <div className="w-72 space-y-1">
          <label htmlFor="range_id" className="block text-xs font-medium text-zinc-500">
            Range / Category
          </label>
          <select id="range_id" name="range_id" defaultValue={selectedRangeId ?? ""} className={inputClass}>
            {ranges.map((r) => (
              <option key={r.id} value={r.id}>
                {r.range_name}
                {r.category ? ` — ${r.category}` : ""}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={linkButtonClass}>
          Switch
        </button>
      </form>

      {!selectedRangeId ? (
        <div className={`p-6 ${cardClass}`}>
          <p className="text-sm text-zinc-600">Create a range first before adding custom fields.</p>
        </div>
      ) : (
        <div className={`p-4 ${cardClass}`}>
          <CustomFieldsManager key={selectedRangeId} rangeId={selectedRangeId} fields={fields} />
        </div>
      )}
    </div>
  );
}
