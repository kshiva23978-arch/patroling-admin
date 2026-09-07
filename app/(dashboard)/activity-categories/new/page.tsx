import { ResourceForm } from "@/components/crud/ResourceForm";
import { activityCategoryDefaults } from "@/lib/schemas/activity-categories";
import { createActivityCategoryAction } from "../actions";

export default function NewActivityCategoryPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Activity Category</h1>
      <ResourceForm
        schemaKey="activityCategorySchema"
        defaultValues={activityCategoryDefaults}
        action={createActivityCategoryAction}
        submitLabel="Create Category"
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
