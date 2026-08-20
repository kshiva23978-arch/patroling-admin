import { ResourceForm } from "@/components/crud/ResourceForm";
import { userCreateDefaults } from "@/lib/schemas/users";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { createUserAction } from "../actions";

export default async function NewUserPage() {
  const [roles, designations] = await Promise.all([listAllRoles(), listAllDesignations()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">New Field User</h1>
      <ResourceForm
        schemaKey="userCreateSchema"
        defaultValues={userCreateDefaults}
        action={createUserAction}
        submitLabel="Create User"
        cancelHref="/users"
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
