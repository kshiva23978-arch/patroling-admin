import { z } from "zod";

export const countrySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
});

export type CountryInput = z.infer<typeof countrySchema>;

export const countryDefaults: CountryInput = { name: "" };
