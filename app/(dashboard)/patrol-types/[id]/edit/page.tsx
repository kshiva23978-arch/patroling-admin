import { ResourceForm } from "@/components/crud/ResourceForm";
import { RANGE_CATEGORIES } from "@/lib/constants";
import { getPatrolType } from "@/lib/resources/patrol-types";
import { updatePatrolTypeAction } from "../../actions";

export default async function EditPatrolTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patrolType = await getPatrolType(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Patrol Type</h1>
      <ResourceForm
        schemaKey="patrolTypeSchema"
        defaultValues={{
          name: patrolType.name,
          description: patrolType.description ?? "",
          status: patrolType.status,
          categories: patrolType.categories as never,
        }}
        action={updatePatrolTypeAction.bind(null, id)}
        submitLabel="Save Changes"
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
