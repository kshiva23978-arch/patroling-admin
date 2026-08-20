import { ResourceForm } from "@/components/crud/ResourceForm";
import { getAdmin } from "@/lib/resources/admins";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { updateAdminAction } from "../../actions";

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [admin, roles, designations] = await Promise.all([getAdmin(id), listAllRoles(), listAllDesignations()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Admin</h1>
      <ResourceForm
        schemaKey="adminUpdateSchema"
        defaultValues={{
          employeeId: admin.employee_id,
          password: "",
          roleId: admin.role ?? "",
          designationId: admin.designation ?? "",
          status: admin.status,
        }}
        action={updateAdminAction.bind(null, id)}
        submitLabel="Save Changes"
        cancelHref="/admins"
        fields={[
          { name: "employeeId", label: "Employee ID", type: "text" },
          {
            name: "password",
            label: "New Password",
            type: "password",
            helpText: "Leave blank to keep the current password.",
          },
          { name: "roleId", label: "Role", type: "select", options: roles.map((r) => ({ value: r.id, label: r.name })) },
          {
            name: "designationId",
            label: "Designation",
            type: "select",
            options: designations.map((d) => ({ value: d.id, label: d.designation_name })),
          },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
