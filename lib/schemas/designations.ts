import { z } from "zod";

export const designationSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  rankOrder: z.number({ error: "Rank order is required." }).int().min(1, "Rank order must be at least 1."),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.boolean(),
});

export type DesignationInput = z.infer<typeof designationSchema>;

export const designationDefaults: DesignationInput = { name: "", rankOrder: 1, description: "", status: true };
