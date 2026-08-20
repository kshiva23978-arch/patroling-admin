import { cardClass } from "@/lib/ui-classes";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className={`w-full max-w-sm p-8 ${cardClass}`}>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Patrolling Admin</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sign in with your admin employee ID.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
