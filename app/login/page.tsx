import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Chargement...
            </p>
          </div>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}