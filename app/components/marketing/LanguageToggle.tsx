"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("lang") === "en" ? "en" : "fr";

  function setLang(lang: "fr" | "en") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", lang);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setLang("fr")}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
          current === "fr"
            ? "bg-sky-600 text-white"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        }`}
      >
        FR
      </button>

      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
          current === "en"
            ? "bg-sky-600 text-white"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}