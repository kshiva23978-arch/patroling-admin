import { z } from "zod";

export const beachCreateSchema = z.object({
  destinationId: z.string().min(1, "Destination is required."),
  name: z.string().trim().min(1, "Name is required.").max(255),
  status: z.boolean(),
});
export type BeachCreateInput = z.infer<typeof beachCreateSchema>;
export const beachCreateDefaults: BeachCreateInput = { destinationId: "", name: "", status: true };

// destination_id is immutable after create (BeachesController@update never accepts it).
export const beachUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  status: z.boolean(),
});
export type BeachUpdateInput = z.infer<typeof beachUpdateSchema>;
