import { z } from "zod";
import { strongPasswordSchema } from "./password";

// `hasLogin: false` is a staff record kept purely for record-keeping (named
// staff with no app login of their own) — see backend `u_has_login`.
// Employee ID/password are only required when `hasLogin` is on, enforced in
// `superRefine` rather than the field schemas themselves so an off `hasLogin`
// can leave them blank without failing validation.
export const userCreateSchema = z
  .object({
    hasLogin: z.boolean(),
    employeeId: z.string().trim().max(255).optional().or(z.literal("")),
    password: z.union([strongPasswordSchema, z.literal("")]),
    roleId: z.string().optional().or(z.literal("")),
    designationId: z.string().optional().or(z.literal("")),
    rangeId: z.string().optional().or(z.literal("")),
    status: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasLogin) return;
    if (!data.employeeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["employeeId"], message: "Employee ID is required." });
    }
    if (!data.password) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "Password is required." });
    }
  });
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export const userCreateDefaults: UserCreateInput = {
  hasLogin: true,
  employeeId: "",
  password: "",
  roleId: "",
  designationId: "",
  rangeId: "",
  status: true,
};

export const userUpdateSchema = z
  .object({
    hasLogin: z.boolean(),
    employeeId: z.string().trim().max(255).optional().or(z.literal("")),
    // Blank means "keep current password" (has login) / not applicable (no login).
    password: z.union([strongPasswordSchema, z.literal("")]),
    roleId: z.string().optional().or(z.literal("")),
    designationId: z.string().optional().or(z.literal("")),
    status: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.hasLogin && !data.employeeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["employeeId"], message: "Employee ID is required." });
    }
  });
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
