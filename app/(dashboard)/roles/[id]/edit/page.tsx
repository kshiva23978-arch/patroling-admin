import { ResourceForm } from "@/components/crud/ResourceForm";
import { getRole, roleToFormValues } from "@/lib/resources/roles";
import { ADMIN_LEVELS, ADMIN_LEVEL_LABELS } from "@/lib/schemas/roles";
import { updateRoleAction } from "../../actions";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getRole(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Edit Role</h1>
      <ResourceForm
        schemaKey="roleSchema"
        defaultValues={roleToFormValues(role)}
        action={updateRoleAction.bind(null, id)}
        submitLabel="Save Changes"
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
