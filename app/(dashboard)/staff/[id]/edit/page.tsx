import { ResourceForm } from "@/components/crud/ResourceForm";
import { getStaff } from "@/lib/resources/staff";
import { listAllRanges } from "@/lib/resources/ranges";
import { listAllDesignations } from "@/lib/resources/designations";
import { updateStaffAction } from "../../actions";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [staff, ranges, designations] = await Promise.all([getStaff(id), listAllRanges(), listAllDesignations()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Staff</h1>
      <ResourceForm
        schemaKey="staffUpdateSchema"
        defaultValues={{
          name: staff.name,
          designationId: staff.designation_id ?? "",
          rangeId: staff.range_id,
          status: staff.status,
        }}
        action={updateStaffAction.bind(null, id)}
        submitLabel="Save Changes"
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
