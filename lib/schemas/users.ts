import { z } from "zod";
import { strongPasswordSchema } from "./password";

export const userCreateSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required.").max(255),
  password: strongPasswordSchema,
  roleId: z.string().optional().or(z.literal("")),
  designationId: z.string().optional().or(z.literal("")),
  status: z.boolean(),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export const userCreateDefaults: UserCreateInput = {
  employeeId: "",
  password: "",
  roleId: "",
  designationId: "",
  status: true,
};

export const userUpdateSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required.").max(255),
  // Blank means "keep current password".
  password: z.union([strongPasswordSchema, z.literal("")]),
  roleId: z.string().optional().or(z.literal("")),
  designationId: z.string().optional().or(z.literal("")),
  status: z.boolean(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
