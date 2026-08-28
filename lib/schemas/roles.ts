import { z } from "zod";

/** Every admin-panel section a role's permissions can name — mirrors backend `Roles::ADMIN_SECTIONS`. */
export const ADMIN_SECTIONS = [
  "dashboard",
  "roles",
  "designations",
  "patrolling_modes",
  "patrol_types",
  "custom_fields",
  "patrollings",
  "cases",
  "activities",
  "ranges",
  "beats",
  "vehicles",
  "admins",
  "users",
  "user_details",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export const ADMIN_SECTION_LABELS: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  roles: "Roles",
  designations: "Designations",
  patrolling_modes: "Patrolling Modes",
  patrol_types: "Patrol Types",
  custom_fields: "Custom Fields",
  patrollings: "Patrollings",
  cases: "Cases",
  activities: "Activities",
  ranges: "Ranges",
  beats: "Beats",
  vehicles: "Vehicles",
  admins: "Admins",
  users: "Field Users",
  user_details: "User Details",
};

/** Every app-side (ranger) feature a role's permissions can name — mirrors backend `Roles::APP_FEATURES`. */
export const APP_FEATURES = ["patrolling", "case", "activity"] as const;

export type AppFeature = (typeof APP_FEATURES)[number];

export const APP_FEATURE_LABELS: Record<AppFeature, string> = {
  patrolling: "Patrolling",
  case: "Case Reports",
  activity: "Activities",
};

const sectionPermissionSchema = z.object({ view: z.boolean(), manage: z.boolean() });

const adminPermissionsSchema = z.object(
  Object.fromEntries(ADMIN_SECTIONS.map((s) => [s, sectionPermissionSchema])) as Record<
    AdminSection,
    typeof sectionPermissionSchema
  >,
);

const appPermissionsSchema = z.object(
  Object.fromEntries(APP_FEATURES.map((f) => [f, z.boolean()])) as Record<AppFeature, z.ZodBoolean>,
);

/**
 * The 4-level RBAC design's 3 admin-table levels — mirrors backend
 * `Roles::ADMIN_LEVELS`. `""` (stored as `null`) means "not an admin-table
 * level role" (the right choice for a role meant for `users`-table
 * accounts, e.g. field staff or an NGO/organization — those are gated by
 * `appPermissions` instead) or, for an admin-table role, the same
 * unrestricted behavior as `master_admin`. Only `department_admin`/
 * `ranger` trigger range-based data scoping — see `Admin::accessibleRangeIds`.
 */
export const ADMIN_LEVELS = ["master_admin", "department_admin", "ranger"] as const;

export type AdminLevel = (typeof ADMIN_LEVELS)[number];

export const ADMIN_LEVEL_LABELS: Record<AdminLevel, string> = {
  master_admin: "Master Admin (unrestricted)",
  department_admin: "Admin (scoped to assigned ranges)",
  ranger: "Ranger (scoped to assigned ranges)",
};

export const roleSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(255),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.boolean(),
  // Whether this role's permissions restrict access at all — off means
  // unrestricted (full access, the default for every role until someone
  // explicitly restricts it; see backend `Roles::hasAdminPermission`).
  // adminPermissions/appPermissions are only actually applied when this is on.
  restricted: z.boolean(),
  adminPermissions: adminPermissionsSchema,
  appPermissions: appPermissionsSchema,
  level: z.union([z.enum(ADMIN_LEVELS), z.literal("")]),
});

export type RoleInput = z.infer<typeof roleSchema>;

const allSectionsGranted = Object.fromEntries(
  ADMIN_SECTIONS.map((s) => [s, { view: true, manage: true }]),
) as RoleInput["adminPermissions"];

const allFeaturesGranted = Object.fromEntries(APP_FEATURES.map((f) => [f, true])) as RoleInput["appPermissions"];

export const roleDefaults: RoleInput = {
  name: "",
  description: "",
  status: true,
  restricted: false,
  adminPermissions: allSectionsGranted,
  appPermissions: allFeaturesGranted,
  level: "",
};
