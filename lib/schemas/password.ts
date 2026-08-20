import { z } from "zod";

// Mirrors Password::min(8)->mixedCase()->numbers()->symbols() in the backend's
// Admin/User store validation (AdminController, UserController).
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");
