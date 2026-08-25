import { ResourceForm } from "@/components/crud/ResourceForm";
import { rangeDefaults } from "@/lib/schemas/ranges";
import { RANGE_CATEGORIES } from "@/lib/constants";
import { listAllPatrollingModes } from "@/lib/resources/patrolling-modes";
import { createRangeAction } from "../actions";

export default async function NewRangePage() {
  const modes = await listAllPatrollingModes();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Range</h1>
      <ResourceForm
        schemaKey="rangeSchema"
        defaultValues={rangeDefaults}
        action={createRangeAction}
        submitLabel="Create Range"
        cancelHref="/ranges"
        fields={[
          { name: "rangeId", label: "Range Code", type: "text", helpText: "A short human-readable identifier, distinct from the display name." },
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
