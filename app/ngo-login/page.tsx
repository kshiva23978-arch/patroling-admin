import Link from "next/link";
import { cardClass } from "@/lib/ui-classes";
import { NgoLoginForm } from "./ngo-login-form";

export default function NgoLoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-green-700 px-4">
      <div className={`w-full max-w-sm p-8 ${cardClass}`}>
        <h1 className="text-lg font-semibold text-zinc-900">NGO / Organization Login</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sign in with the same employee ID and password used on the field app to view your organization&apos;s
          conducted activities.
        </p>
        <div className="mt-6">
          <NgoLoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">
          <Link href="/login" className="hover:underline">
            Staff/Admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
