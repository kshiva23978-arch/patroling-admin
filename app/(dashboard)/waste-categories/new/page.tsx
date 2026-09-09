import { ResourceForm } from "@/components/crud/ResourceForm";
import { wasteCategoryDefaults } from "@/lib/schemas/waste-categories";
import { createWasteCategoryAction } from "../actions";

export default function NewWasteCategoryPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Waste Category</h1>
      <ResourceForm
        schemaKey="wasteCategorySchema"
        defaultValues={wasteCategoryDefaults}
        action={createWasteCategoryAction}
        submitLabel="Create Waste Category"
        cancelHref="/waste-categories"
        fields={[
          { name: "name", label: "Name", type: "text", placeholder: "e.g. Plastic, Thermocol, Glass" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
