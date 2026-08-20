import { ResourceForm } from "@/components/crud/ResourceForm";
import { getBeat } from "@/lib/resources/beats";
import { getRange } from "@/lib/resources/ranges";
import { updateBeatAction } from "../../actions";

export default async function EditBeatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beat = await getBeat(id);
  const range = await getRange(beat.range_id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Beat</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Range: <span className="font-medium text-zinc-900 dark:text-zinc-100">{range.range_name}</span> (fixed at creation)
      </p>
      <ResourceForm
        schemaKey="beatUpdateSchema"
        defaultValues={{ name: beat.name, status: beat.status }}
        action={updateBeatAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/beats"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
