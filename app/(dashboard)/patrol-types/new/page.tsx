import { ResourceForm } from "@/components/crud/ResourceForm";
import { patrolTypeDefaults } from "@/lib/schemas/patrol-types";
import { RANGE_CATEGORIES } from "@/lib/constants";
import { createPatrolTypeAction } from "../actions";

export default function NewPatrolTypePage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Patrol Type</h1>
      <ResourceForm
        schemaKey="patrolTypeSchema"
        defaultValues={patrolTypeDefaults}
        action={createPatrolTypeAction}
        submitLabel="Create Patrol Type"
        cancelHref="/patrol-types"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          {
            name: "categories",
            label: "Allowed Range Categories",
            type: "multiselect",
            options: RANGE_CATEGORIES.map((c) => ({ value: c, label: c })),
            helpText: "Leave empty to allow this patrol type for every range category. Ctrl/Cmd-click to select multiple.",
          },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
