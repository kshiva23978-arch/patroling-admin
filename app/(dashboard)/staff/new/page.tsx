import { ResourceForm } from "@/components/crud/ResourceForm";
import { staffCreateDefaults } from "@/lib/schemas/staff";
import { listAllRanges } from "@/lib/resources/ranges";
import { listAllDesignations } from "@/lib/resources/designations";
import { createStaffAction } from "../actions";

export default async function NewStaffPage() {
  const [ranges, designations] = await Promise.all([listAllRanges(), listAllDesignations()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Staff</h1>
      <ResourceForm
        schemaKey="staffCreateSchema"
        defaultValues={staffCreateDefaults}
        action={createStaffAction}
        submitLabel="Create Staff"
        cancelHref="/staff"
        fields={[
          { name: "name", label: "Name", type: "text" },
          {
            name: "designationId",
            label: "Designation",
            type: "select",
            options: designations.map((d) => ({ value: d.id, label: d.designation_name })),
          },
          { name: "rangeId", label: "Range", type: "select", options: ranges.map((r) => ({ value: r.id, label: r.range_name })) },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
