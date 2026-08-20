import { z } from "zod";

export const beatCreateSchema = z.object({
  rangeId: z.string().min(1, "Range is required."),
  name: z.string().trim().min(1, "Name is required.").max(255),
  status: z.boolean(),
});
export type BeatCreateInput = z.infer<typeof beatCreateSchema>;
export const beatCreateDefaults: BeatCreateInput = { rangeId: "", name: "", status: true };

// range_id is immutable after create (BeatController@update never accepts it).
export const beatUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  status: z.boolean(),
});
export type BeatUpdateInput = z.infer<typeof beatUpdateSchema>;
