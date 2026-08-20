import { ResourceForm } from "@/components/crud/ResourceForm";
import { RANGE_CATEGORIES } from "@/lib/constants";
import { getRange } from "@/lib/resources/ranges";
import { listAllPatrollingModes } from "@/lib/resources/patrolling-modes";
import { updateRangeAction } from "../../actions";

export default async function EditRangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [range, modes] = await Promise.all([getRange(id), listAllPatrollingModes()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Range</h1>
      <ResourceForm
        schemaKey="rangeSchema"
        defaultValues={{
          rangeId: range.range_id,
          rangeName: range.range_name,
          category: (range.category ?? "") as never,
          rangeHeadquarter: range.range_headquarter,
          keyActivities: range.key_activities ?? "",
          patrollingModeIds: range.patrolling_modes.map((m) => m.id),
        }}
        action={updateRangeAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/ranges"
        fields={[
          { name: "rangeId", label: "Range Code", type: "text" },
          { name: "rangeName", label: "Range Name", type: "text" },
          { name: "category", label: "Category", type: "select", options: RANGE_CATEGORIES.map((c) => ({ value: c, label: c })) },
          { name: "rangeHeadquarter", label: "Headquarter", type: "text" },
          { name: "keyActivities", label: "Key Activities", type: "textarea" },
          {
            name: "patrollingModeIds",
            label: "Patrolling Modes",
            type: "multiselect",
            options: modes.map((m) => ({ value: m.id, label: m.mode_name })),
            helpText: "Ctrl/Cmd-click to select multiple.",
          },
        ]}
      />
    </div>
  );
}
