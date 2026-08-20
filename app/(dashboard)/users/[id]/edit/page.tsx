import { ResourceForm } from "@/components/crud/ResourceForm";
import { getUser } from "@/lib/resources/users";
import { getUserDetailsForUser } from "@/lib/resources/user-details";
import { listAllRoles } from "@/lib/resources/roles";
import { listAllDesignations } from "@/lib/resources/designations";
import { listAllRanges } from "@/lib/resources/ranges";
import { listRangesForUser } from "@/lib/resources/user-range-access";
import { cardClass } from "@/lib/ui-classes";
import { updateUserAction, saveUserDetailsAction } from "../../actions";
import { RangeAccessSection } from "./range-access-section";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, roles, designations, details, allRanges, assignedRanges] = await Promise.all([
    getUser(id),
    listAllRoles(),
    listAllDesignations(),
    getUserDetailsForUser(id),
    listAllRanges(),
    listRangesForUser(id),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Field User</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.employee_id}</p>
      </div>

      <section className={`space-y-4 p-6 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Account</h2>
        <ResourceForm
          schemaKey="userUpdateSchema"
          defaultValues={{
            employeeId: user.employee_id,
            password: "",
            roleId: user.role ?? "",
            designationId: user.designation ?? "",
            status: user.status,
          }}
          action={updateUserAction.bind(null, id)}
          submitLabel="Save Changes"
          cancelHref="/users"
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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Contact Details</h2>
        <ResourceForm
          schemaKey="userDetailsSchema"
          defaultValues={{
            fullname: details?.fullname ?? "",
            mobileNumber: details?.mobile_number ?? "",
            email: details?.email ?? "",
          }}
          action={saveUserDetailsAction.bind(null, id)}
          submitLabel="Save Contact Details"
          cancelHref="/users"
          fields={[
            { name: "fullname", label: "Full Name", type: "text" },
            { name: "mobileNumber", label: "Mobile Number", type: "text" },
            { name: "email", label: "Email", type: "text" },
          ]}
        />
      </section>

      <section className={`space-y-4 p-6 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Range Access</h2>
        <RangeAccessSection userId={id} assignedRanges={assignedRanges} allRanges={allRanges} />
      </section>
    </div>
  );
}
