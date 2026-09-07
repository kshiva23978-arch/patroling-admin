import { z } from "zod";

export const activityCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  has_report: z.boolean(),
});

export type ActivityCategoryInput = z.infer<typeof activityCategorySchema>;

export const activityCategoryDefaults: ActivityCategoryInput = {
  name: "",
  description: "",
  has_report: false,
};
