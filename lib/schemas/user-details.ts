import { z } from "zod";

export const userDetailsSchema = z.object({
  fullname: z.string().trim().min(1, "Full name is required.").max(255),
  mobileNumber: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.union([z.string().trim().email("Enter a valid email address."), z.literal("")]),
});

export type UserDetailsInput = z.infer<typeof userDetailsSchema>;
