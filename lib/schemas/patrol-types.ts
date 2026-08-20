import { z } from "zod";
import { RANGE_CATEGORIES } from "@/lib/constants";

export const patrolTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.boolean(),
  categories: z.array(z.enum(RANGE_CATEGORIES)),
});

export type PatrolTypeInput = z.infer<typeof patrolTypeSchema>;

export const patrolTypeDefaults: PatrolTypeInput = { name: "", description: "", status: true, categories: [] };
