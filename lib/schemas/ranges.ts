import { z } from "zod";
import { RANGE_CATEGORIES } from "@/lib/constants";

export const rangeSchema = z.object({
  rangeId: z.string().trim().min(1, "Range ID is required.").max(100),
  rangeName: z.string().trim().min(1, "Range name is required.").max(100),
  category: z.union([z.enum(RANGE_CATEGORIES), z.literal("")]),
  rangeHeadquarter: z.string().trim().min(1, "Headquarter is required.").max(100),
  keyActivities: z.string().trim().max(4000).optional().or(z.literal("")),
  patrollingModeIds: z.array(z.string()),
});

export type RangeInput = z.infer<typeof rangeSchema>;

export const rangeDefaults: RangeInput = {
  rangeId: "",
  rangeName: "",
  category: "",
  rangeHeadquarter: "",
  keyActivities: "",
  patrollingModeIds: [],
};
