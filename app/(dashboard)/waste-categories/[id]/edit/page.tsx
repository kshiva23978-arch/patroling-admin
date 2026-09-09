import { ResourceForm } from "@/components/crud/ResourceForm";
import { getWasteCategory } from "@/lib/resources/waste-categories";
import { updateWasteCategoryAction } from "../../actions";

export default async function EditWasteCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getWasteCategory(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Waste Category</h1>
      <ResourceForm
        schemaKey="wasteCategorySchema"
        defaultValues={{ name: category.name, status: category.status }}
        action={updateWasteCategoryAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/waste-categories"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
