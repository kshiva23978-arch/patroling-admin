import { ResourceForm } from "@/components/crud/ResourceForm";
import { patrollingModeDefaults } from "@/lib/schemas/patrolling-modes";
import { createPatrollingModeAction } from "../actions";

export default function NewPatrollingModePage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Patrolling Mode</h1>
      <ResourceForm
        schemaKey="patrollingModeSchema"
        defaultValues={patrollingModeDefaults}
        action={createPatrollingModeAction}
        submitLabel="Create Mode"
        cancelHref="/patrolling-modes"
        fields={[{ name: "name", label: "Mode Name", type: "text" }]}
      />
    </div>
  );
}
