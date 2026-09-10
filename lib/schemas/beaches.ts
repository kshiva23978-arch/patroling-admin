import { z } from "zod";

// Optional: shares this beach into one other destination's beach list (e.g.
// a South Andaman beach also shown under Middle Andaman) — capped at one
// extra destination, so it's a single field rather than a list.
const sharedDestinationRefinement = <T extends { destinationId: string; sharedDestinationId?: string }>(data: T, ctx: z.RefinementCtx) => {
  if (data.sharedDestinationId && data.sharedDestinationId === data.destinationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Shared destination must be different from the primary destination.",
      path: ["sharedDestinationId"],
    });
  }
};

export const beachCreateSchema = z
  .object({
    destinationId: z.string().min(1, "Destination is required."),
    sharedDestinationId: z.string().optional(),
    name: z.string().trim().min(1, "Name is required.").max(255),
    status: z.boolean(),
  })
  .superRefine(sharedDestinationRefinement);
export type BeachCreateInput = z.infer<typeof beachCreateSchema>;
export const beachCreateDefaults: BeachCreateInput = { destinationId: "", sharedDestinationId: "", name: "", status: true };

export const beachUpdateSchema = z
  .object({
    destinationId: z.string().min(1, "Destination is required."),
    sharedDestinationId: z.string().optional(),
    name: z.string().trim().min(1, "Name is required.").max(255),
    status: z.boolean(),
  })
  .superRefine(sharedDestinationRefinement);
export type BeachUpdateInput = z.infer<typeof beachUpdateSchema>;
