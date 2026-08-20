import { z } from "zod";

export const VEHICLE_TYPES = ["vehicle", "boat"] as const;

export const vehicleCreateSchema = z.object({
  rangeId: z.string().min(1, "Range is required."),
  registrationNumber: z.string().trim().min(1, "Registration number is required.").max(50),
  type: z.enum(VEHICLE_TYPES),
  status: z.boolean(),
});
export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export const vehicleCreateDefaults: VehicleCreateInput = { rangeId: "", registrationNumber: "", type: "vehicle", status: true };

// range_id is immutable after create (VehicleController@update never accepts it).
export const vehicleUpdateSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required.").max(50),
  type: z.enum(VEHICLE_TYPES),
  status: z.boolean(),
});
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
