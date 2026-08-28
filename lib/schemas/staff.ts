import { z } from "zod";

export const staffCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(150),
  designationId: z.string().optional().or(z.literal("")),
  rangeId: z.string().min(1, "Range is required."),
  status: z.boolean(),
});
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export const staffCreateDefaults: StaffCreateInput = {
  name: "",
  designationId: "",
  rangeId: "",
  status: true,
};

export const staffUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(150),
  designationId: z.string().optional().or(z.literal("")),
  rangeId: z.string().min(1, "Range is required."),
  status: z.boolean(),
});
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
