import { z } from "zod";

export const REPORT_FIELD_INPUT_TYPES = ["text", "number", "boolean", "dropdown", "date", "time", "photo"] as const;

export type ReportFieldInputType = (typeof REPORT_FIELD_INPUT_TYPES)[number];

export const reportFieldSchema = z
  .object({
    fieldName: z.string().trim().min(1, "Field name is required.").max(150),
    inputType: z.enum(REPORT_FIELD_INPUT_TYPES),
    options: z.array(z.string().trim().min(1)).max(50),
    isRequired: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((v) => v.inputType !== "dropdown" || v.options.length > 0, {
    message: "Add at least one option for a dropdown field.",
    path: ["options"],
  });

export type ReportFieldInput = z.infer<typeof reportFieldSchema>;

export const reportFieldDefaults: ReportFieldInput = {
  fieldName: "",
  inputType: "text",
  options: [],
  isRequired: false,
  isActive: true,
};

export const reportFieldGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required.").max(150),
});

export type ReportFieldGroupInput = z.infer<typeof reportFieldGroupSchema>;

export const reportFieldGroupDefaults: ReportFieldGroupInput = { name: "" };
