"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { loginAction } from "./actions";
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui-classes";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { employeeId: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    setRootError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        setRootError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field === "employee_id" ? "employeeId" : (field as keyof LoginInput), {
                message: messages[0],
              });
            }
          }
        }
      }
      // On success, loginAction redirects server-side.
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {rootError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {rootError}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="employeeId" className={labelClass}>
          User ID
        </label>
        <input
          id="employeeId"
          type="text"
          autoComplete="username"
          className={inputClass}
          disabled={isPending}
          {...register("employeeId")}
        />
        {errors.employeeId && <p className={errorTextClass}>{errors.employeeId.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          disabled={isPending}
          {...register("password")}
        />
        {errors.password && <p className={errorTextClass}>{errors.password.message}</p>}
      </div>

      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
