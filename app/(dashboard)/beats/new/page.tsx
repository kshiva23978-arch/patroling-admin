import { ResourceForm } from "@/components/crud/ResourceForm";
import { beatCreateDefaults } from "@/lib/schemas/beats";
import { listAllRanges } from "@/lib/resources/ranges";
import { createBeatAction } from "../actions";

export default async function NewBeatPage() {
  const ranges = await listAllRanges();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Beat</h1>
      <ResourceForm
        schemaKey="beatCreateSchema"
        defaultValues={beatCreateDefaults}
        action={createBeatAction}
        submitLabel="Create Beat"
        cancelHref="/beats"
        fields={[
          { name: "rangeId", label: "Range", type: "select", options: ranges.map((r) => ({ value: r.id, label: r.range_name })) },
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
