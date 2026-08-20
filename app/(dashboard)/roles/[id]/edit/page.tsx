import { ResourceForm } from "@/components/crud/ResourceForm";
import { getRole } from "@/lib/resources/roles";
import { updateRoleAction } from "../../actions";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = await getRole(id);

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Role</h1>
      <ResourceForm
        schemaKey="roleSchema"
        defaultValues={{ name: role.name, description: role.description ?? "", status: role.status }}
        action={updateRoleAction.bind(null, id)}
        submitLabel="Save Changes"
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
