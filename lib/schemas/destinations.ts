import { z } from "zod";

export const destinationSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  status: z.boolean(),
});

export type DestinationInput = z.infer<typeof destinationSchema>;

export const destinationDefaults: DestinationInput = { name: "", status: true };
