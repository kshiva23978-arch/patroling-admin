import { ResourceForm } from "@/components/crud/ResourceForm";
import { getDesignation } from "@/lib/resources/designations";
import { updateDesignationAction } from "../../actions";

export default async function EditDesignationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const designation = await getDesignation(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Designation</h1>
      <ResourceForm
        schemaKey="designationSchema"
        defaultValues={{
          name: designation.designation_name,
          rankOrder: designation.rank_order,
          description: designation.description ?? "",
          status: designation.status,
        }}
        action={updateDesignationAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/designations"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "rankOrder", label: "Rank Order", type: "number", helpText: "Lower numbers rank higher." },
          { name: "description", label: "Description", type: "textarea" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
