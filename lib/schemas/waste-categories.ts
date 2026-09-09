import { z } from "zod";

export const wasteCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  status: z.boolean(),
});

export type WasteCategoryInput = z.infer<typeof wasteCategorySchema>;

export const wasteCategoryDefaults: WasteCategoryInput = { name: "", status: true };
