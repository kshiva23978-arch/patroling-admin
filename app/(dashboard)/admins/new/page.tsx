import { ResourceForm } from "@/components/crud/ResourceForm";
import { adminCreateDefaults } from "@/lib/schemas/admins";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { createAdminAction } from "../actions";

export default async function NewAdminPage() {
  const [roles, designations] = await Promise.all([listAllRoles(), listAllDesignations()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Admin</h1>
      <ResourceForm
        schemaKey="adminCreateSchema"
        defaultValues={adminCreateDefaults}
        action={createAdminAction}
        submitLabel="Create Admin"
        cancelHref="/admins"
        fields={[
          { name: "employeeId", label: "Employee ID", type: "text" },
          {
            name: "password",
            label: "Password",
            type: "password",
            helpText: "At least 8 characters, with uppercase, lowercase, a number, and a symbol.",
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
