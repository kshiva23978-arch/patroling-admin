import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.boolean(),
});

export type RoleInput = z.infer<typeof roleSchema>;

export const roleDefaults: RoleInput = { name: "", description: "", status: true };
