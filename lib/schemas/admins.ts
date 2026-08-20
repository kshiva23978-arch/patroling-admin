import { z } from "zod";
import { strongPasswordSchema } from "./password";

export const adminCreateSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required.").max(255),
  password: strongPasswordSchema,
  roleId: z.string().optional().or(z.literal("")),
  designationId: z.string().optional().or(z.literal("")),
  status: z.boolean(),
});
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export const adminCreateDefaults: AdminCreateInput = {
  employeeId: "",
  password: "",
  roleId: "",
  designationId: "",
  status: true,
};

export const adminUpdateSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required.").max(255),
  // Blank means "keep current password" — see toUpdatePayload in lib/resources/admins.ts.
  password: z.union([strongPasswordSchema, z.literal("")]),
  roleId: z.string().optional().or(z.literal("")),
  designationId: z.string().optional().or(z.literal("")),
  status: z.boolean(),
});
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;
