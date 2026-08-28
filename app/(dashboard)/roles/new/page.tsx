import { ResourceForm } from "@/components/crud/ResourceForm";
import { roleDefaults, ADMIN_LEVELS, ADMIN_LEVEL_LABELS } from "@/lib/schemas/roles";
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
          {
            name: "level",
            label: "RBAC Level (admin accounts only)",
            type: "select",
            helpText:
              "Leave unset for a role meant for Field Users (staff/NGO app accounts), or for an unrestricted admin role.",
            options: ADMIN_LEVELS.map((l) => ({ value: l, label: ADMIN_LEVEL_LABELS[l] })),
          },
          { name: "restricted", label: "Permissions", type: "permissions" },
        ]}
      />
    </div>
  );
}
