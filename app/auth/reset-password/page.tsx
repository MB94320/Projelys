import { Suspense } from "react";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
          <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Chargement...
            </p>
          </div>
        </main>
      }
    >
      <ResetPasswordPageClient />
    </Suspense>
  );
}