import { z } from "zod";

export const appVersionSchema = z
  .object({
    latest_version: z
      .string()
      .trim()
      .regex(/^\d+\.\d+\.\d+$/, "Use the x.y.z form from pubspec.yaml, e.g. 1.2.0."),
    latest_build: z.number().int().min(1, "Build number must be at least 1."),
    min_supported_build: z.number().int().min(1, "Build number must be at least 1."),
    update_url: z.string().trim().url("Enter a full URL, e.g. the Play Store listing.").optional().or(z.literal("")),
    release_notes: z.string().trim().max(5000).optional().or(z.literal("")),
  })
  .refine((v) => v.min_supported_build <= v.latest_build, {
    message: "Minimum supported build cannot be newer than the latest build.",
    path: ["min_supported_build"],
  });

export type AppVersionFormInput = z.infer<typeof appVersionSchema>;
