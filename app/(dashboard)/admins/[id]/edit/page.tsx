import { ResourceForm } from "@/components/crud/ResourceForm";
import { getAdmin } from "@/lib/resources/admins";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { listAllRanges } from "@/lib/resources/ranges";
import { listRangesForAdmin } from "@/lib/resources/admin-range-access";
import { cardClass } from "@/lib/ui-classes";
import { updateAdminAction } from "../../actions";
import { RangeAccessSection } from "./range-access-section";

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [admin, roles, designations, allRanges, assignedRanges] = await Promise.all([
    getAdmin(id),
    listAllRoles(),
    listAllDesignations(),
    listAllRanges(),
    listRangesForAdmin(id),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Edit Admin</h1>
        <p className="text-sm text-zinc-500">{admin.employee_id}</p>
      </div>

      <section className={`space-y-4 p-6 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
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
      </section>

      <section className={`space-y-4 p-6 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900">Range Access</h2>
        <p className="text-xs text-zinc-500">
          Only takes effect for a Department Admin or Ranger-level role — a Master Admin role sees every range
          regardless.
        </p>
        <RangeAccessSection adminId={id} assignedRanges={assignedRanges} allRanges={allRanges} />
      </section>
    </div>
  );
}
