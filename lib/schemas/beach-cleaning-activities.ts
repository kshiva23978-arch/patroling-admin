import { z } from "zod";

/** Drive Details header edit — mirrors the app's own `create`/`update` officer-name rule and `updateCollection`'s weight rule. */
export const beachCleaningDetailsSchema = z.object({
  officerName: z.string().trim().min(1, "Officer / Point of Contact is required.").max(150),
  totalWeightKg: z.number().min(0).max(999999.99).nullable(),
});

export type BeachCleaningDetailsInput = z.infer<typeof beachCleaningDetailsSchema>;

/** One origin/category collection row — same fields as the app's step-4 "+ Add More" sheet. */
export const beachCleaningSegregationSchema = z.object({
  countryId: z.string().uuid("Select an origin."),
  wasteCategoryId: z.string().uuid("Select a category."),
  quantityKg: z.number().min(0.01, "Enter a quantity.").max(999999.99),
  weightKg: z.number().min(0.01).max(999999.99).nullable(),
});

export type BeachCleaningSegregationInput = z.infer<typeof beachCleaningSegregationSchema>;

export const beachCleaningSegregationDefaults: BeachCleaningSegregationInput = {
  countryId: "",
  wasteCategoryId: "",
  quantityKg: 0,
  weightKg: null,
};
