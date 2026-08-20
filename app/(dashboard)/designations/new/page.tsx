import { ResourceForm } from "@/components/crud/ResourceForm";
import { designationDefaults } from "@/lib/schemas/designations";
import { createDesignationAction } from "../actions";

export default function NewDesignationPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Designation</h1>
      <ResourceForm
        schemaKey="designationSchema"
        defaultValues={designationDefaults}
        action={createDesignationAction}
        submitLabel="Create Designation"
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
