import { z } from "zod";

export const patrollingModeSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
});

export type PatrollingModeInput = z.infer<typeof patrollingModeSchema>;

export const patrollingModeDefaults: PatrollingModeInput = { name: "" };
