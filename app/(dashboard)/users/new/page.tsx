import { ResourceForm } from "@/components/crud/ResourceForm";
import { userCreateDefaults } from "@/lib/schemas/users";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { listAllRanges } from "@/lib/resources/ranges";
import { createUserAction } from "../actions";

export default async function NewUserPage() {
  const [roles, designations, ranges] = await Promise.all([listAllRoles(), listAllDesignations(), listAllRanges()]);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Field User</h1>
      <ResourceForm
        schemaKey="userCreateSchema"
        defaultValues={userCreateDefaults}
        action={createUserAction}
        submitLabel="Create User"
        cancelHref="/users"
        fields={[
          {
            name: "hasLogin",
            label: "Has App Login",
            type: "switch",
            helpText: "Off adds a staff record with no login of their own — for record-keeping only.",
          },
          { name: "employeeId", label: "Employee ID", type: "text", helpText: "Required only when Has App Login is on." },
          {
            name: "password",
            label: "Password",
            type: "password",
            helpText: "Required only when Has App Login is on. At least 8 characters, with uppercase, lowercase, a number, and a symbol.",
          },
          { name: "roleId", label: "Role", type: "select", options: roles.map((r) => ({ value: r.id, label: r.name })) },
          {
            name: "designationId",
            label: "Designation",
            type: "select",
            options: designations.map((d) => ({ value: d.id, label: d.designation_name })),
          },
          {
            name: "rangeId",
            label: "Range",
            type: "select",
            options: ranges.map((r) => ({ value: r.id, label: r.range_name })),
          },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
