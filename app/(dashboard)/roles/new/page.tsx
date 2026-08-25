import { ResourceForm } from "@/components/crud/ResourceForm";
import { roleDefaults } from "@/lib/schemas/roles";
import { createRoleAction } from "../actions";

export default function NewRolePage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">New Role</h1>
      <ResourceForm
        schemaKey="roleSchema"
        defaultValues={roleDefaults}
        action={createRoleAction}
        submitLabel="Create Role"
        cancelHref="/roles"
        fields={[
          { name: "name", label: "Name", type: "text" },
          { name: "description", label: "Description", type: "textarea" },
          { name: "status", label: "Active", type: "switch" },
        ]}
      />
    </div>
  );
}
