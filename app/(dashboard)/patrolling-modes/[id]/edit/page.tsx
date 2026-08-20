import { ResourceForm } from "@/components/crud/ResourceForm";
import { getPatrollingMode } from "@/lib/resources/patrolling-modes";
import { updatePatrollingModeAction } from "../../actions";

export default async function EditPatrollingModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mode = await getPatrollingMode(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Patrolling Mode</h1>
      <ResourceForm
        schemaKey="patrollingModeSchema"
        defaultValues={{ name: mode.mode_name }}
        action={updatePatrollingModeAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/patrolling-modes"
        fields={[{ name: "name", label: "Mode Name", type: "text" }]}
      />
    </div>
  );
}
