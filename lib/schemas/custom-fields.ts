import { z } from "zod";

export const CUSTOM_FIELD_INPUT_TYPES = ["text", "boolean", "dropdown", "time", "date", "number"] as const;

export const customFieldSchema = z
  .object({
    fieldName: z.string().trim().min(1, "Field name is required.").max(150),
    inputType: z.enum(CUSTOM_FIELD_INPUT_TYPES),
    options: z.array(z.string().trim().min(1)).max(50),
    isRequired: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((v) => v.inputType !== "dropdown" || v.options.length > 0, {
    message: "Add at least one option for a dropdown field.",
    path: ["options"],
  });

export type CustomFieldInput = z.infer<typeof customFieldSchema>;

export const customFieldDefaults: CustomFieldInput = {
  fieldName: "",
  inputType: "text",
  options: [],
  isRequired: false,
  isActive: true,
};
