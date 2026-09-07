import { ResourceForm } from "@/components/crud/ResourceForm";
import { getActivityCategory } from "@/lib/resources/activity-categories";
import { updateActivityCategoryAction } from "../../actions";

export default async function EditActivityCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getActivityCategory(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Activity Category</h1>
      <ResourceForm
        schemaKey="activityCategorySchema"
        defaultValues={{
          name: category.name,
          description: category.description ?? "",
          has_report: category.has_report,
        }}
        action={updateActivityCategoryAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/activity-categories"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "has_report", label: "Has Report", type: "switch" },
        ]}
      />
    </div>
  );
}
