"use client";

import { useState, useTransition } from "react";
import { useForm, type FieldValues, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import {
  errorTextClass,
  helpTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/ui-classes";
import { adminCreateSchema, adminUpdateSchema, type AdminCreateInput, type AdminUpdateInput } from "@/lib/schemas/admins";
import { beatCreateSchema, beatUpdateSchema, type BeatCreateInput, type BeatUpdateInput } from "@/lib/schemas/beats";
import { designationSchema, type DesignationInput } from "@/lib/schemas/designations";
import { patrolTypeSchema, type PatrolTypeInput } from "@/lib/schemas/patrol-types";
import { patrollingModeSchema, type PatrollingModeInput } from "@/lib/schemas/patrolling-modes";
import { rangeSchema, type RangeInput } from "@/lib/schemas/ranges";
import { roleSchema, type RoleInput } from "@/lib/schemas/roles";
import { userDetailsSchema, type UserDetailsInput } from "@/lib/schemas/user-details";
import { userCreateSchema, userUpdateSchema, type UserCreateInput, type UserUpdateInput } from "@/lib/schemas/users";
import { vehicleCreateSchema, vehicleUpdateSchema, type VehicleCreateInput, type VehicleUpdateInput } from "@/lib/schemas/vehicles";

/**
 * Zod schema instances are class instances (not plain objects) and cannot be
 * passed as props from a Server Component into this Client Component. Call
 * sites pass a `schemaKey` string instead, resolved here where the actual
 * schema modules are imported directly on the client.
 */
const schemaRegistry = {
  adminCreateSchema,
  adminUpdateSchema,
  beatCreateSchema,
  beatUpdateSchema,
  designationSchema,
  patrolTypeSchema,
  patrollingModeSchema,
  rangeSchema,
  roleSchema,
  userDetailsSchema,
  userCreateSchema,
  userUpdateSchema,
  vehicleCreateSchema,
  vehicleUpdateSchema,
} satisfies Record<string, ZodType<FieldValues>>;

interface SchemaKeyMap {
  adminCreateSchema: AdminCreateInput;
  adminUpdateSchema: AdminUpdateInput;
  beatCreateSchema: BeatCreateInput;
  beatUpdateSchema: BeatUpdateInput;
  designationSchema: DesignationInput;
  patrolTypeSchema: PatrolTypeInput;
  patrollingModeSchema: PatrollingModeInput;
  rangeSchema: RangeInput;
  roleSchema: RoleInput;
  userDetailsSchema: UserDetailsInput;
  userCreateSchema: UserCreateInput;
  userUpdateSchema: UserUpdateInput;
  vehicleCreateSchema: VehicleCreateInput;
  vehicleUpdateSchema: VehicleUpdateInput;
}

export type SchemaKey = keyof SchemaKeyMap;

export type SelectOption = { value: string; label: string };

export type FieldType = "text" | "password" | "number" | "textarea" | "select" | "multiselect" | "switch";

export interface FieldConfig<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  type: FieldType;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  helpText?: string;
}

interface ResourceFormProps<K extends SchemaKey> {
  schemaKey: K;
  fields: FieldConfig<SchemaKeyMap[K]>[];
  defaultValues: SchemaKeyMap[K];
  action: (values: SchemaKeyMap[K]) => Promise<ActionResult>;
  submitLabel: string;
  cancelHref: string;
}

/**
 * Config-driven create/edit form shared by every admin resource. Server
 * Actions redirect on success (see lib/action-result.ts convention), so the
 * happy path never actually reaches the toast below — it's only exercised if
 * a future action returns {success:true} without redirecting.
 */
export function ResourceForm<K extends SchemaKey>({
  schemaKey,
  fields,
  defaultValues,
  action,
  submitLabel,
  cancelHref,
}: ResourceFormProps<K>) {
  type TFieldValues = SchemaKeyMap[K];
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);
  const router = useRouter();
  const schema = schemaRegistry[schemaKey];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TFieldValues>({
    // Generic zod<->react-hook-form wiring loses precise inference across a
    // shared component boundary; the runtime behavior is correct per resource.
    resolver: zodResolver(schema as never) as unknown as Resolver<TFieldValues>,
    defaultValues: defaultValues as never,
  });

  const onSubmit = handleSubmit((values) => {
    setRootError(null);
    startTransition(async () => {
      const result = await action(values);
      if (!result.success) {
        setRootError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as Path<TFieldValues>, { message: messages[0] });
            }
          }
        }
        return;
      }
      toast.success("Saved.");
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {rootError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {rootError}
        </div>
      )}

      {fields.map((field) => {
        const fieldError = (errors as Record<string, { message?: string } | undefined>)[field.name]?.message;
        const fieldId = String(field.name);

        return (
          <div key={fieldId} className="space-y-1">
            {field.type !== "switch" && (
              <label htmlFor={fieldId} className={labelClass}>
                {field.label}
              </label>
            )}

            {field.type === "textarea" && (
              <textarea
                id={fieldId}
                rows={3}
                placeholder={field.placeholder}
                disabled={field.disabled || isPending}
                className={inputClass}
                {...register(field.name)}
              />
            )}

            {field.type === "select" && (
              <select id={fieldId} disabled={field.disabled || isPending} className={inputClass} {...register(field.name)}>
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "multiselect" && (
              <select
                id={fieldId}
                multiple
                disabled={field.disabled || isPending}
                className={`${inputClass} h-32`}
                {...register(field.name)}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "switch" && (
              <label htmlFor={fieldId} className="flex items-center gap-2 pt-1">
                <input
                  id={fieldId}
                  type="checkbox"
                  disabled={field.disabled || isPending}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                  {...register(field.name)}
                />
                <span className={labelClass}>{field.label}</span>
              </label>
            )}

            {(field.type === "text" || field.type === "password" || field.type === "number") && (
              <input
                id={fieldId}
                type={field.type}
                autoComplete={field.type === "password" ? "new-password" : undefined}
                placeholder={field.placeholder}
                disabled={field.disabled || isPending}
                className={inputClass}
                {...register(field.name, field.type === "number" ? { valueAsNumber: true } : undefined)}
              />
            )}

            {field.helpText && <p className={helpTextClass}>{field.helpText}</p>}
            {fieldError && <p className={errorTextClass}>{fieldError}</p>}
          </div>
        );
      })}

      <div className="flex gap-2 pt-2">
        <button type="submit" className={primaryButtonClass} disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button type="button" className={secondaryButtonClass} disabled={isPending} onClick={() => router.push(cancelHref)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
