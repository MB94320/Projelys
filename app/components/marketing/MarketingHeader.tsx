"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LanguageToggle from "./LanguageToggle";
import { Lang, content } from "./marketing-content";

export default function MarketingHeader({ lang }: { lang: Lang }) {
  const t = content[lang];
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href={`/site?lang=${lang}`} className="flex items-center gap-3">
          <Image
            src="/PROJELYS.png"
            alt="Projelys"
            width={44}
            height={44}
            className="h-11 w-11 rounded-xl object-contain"
          />
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
              Projelys
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Project Portfolio & Performance Control
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              <span>{lang === "fr" ? "Découvrir" : "Explore"}</span>
              <svg
                className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <div className="absolute left-0 top-10 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
                <Link
                  href={`/site/how-it-works?lang=${lang}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 transition hover:bg-cyan-50 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {lang === "fr" ? "Méthode de pilotage" : "How it works"}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {lang === "fr"
                      ? "Le fonctionnement global de Projelys, du commercial à la performance."
                      : "The overall Projelys flow, from pipeline to performance."}
                  </div>
                </Link>

                <Link
                  href={`/site/about?lang=${lang}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 transition hover:bg-fuchsia-50 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {lang === "fr" ? "À propos" : "About"}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {lang === "fr"
                      ? "La vision produit, l’origine du projet et ses principes."
                      : "Product vision, project origin and core principles."}
                  </div>
                </Link>
              </div>
            )}
          </div>
          
          <Link
            href={`/site/features?lang=${lang}`}
            className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            {t.nav.features}
          </Link>

          
          <Link
            href={`/site/pricing?lang=${lang}`}
            className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            {t.nav.pricing}
          </Link>
          <Link
            href={`/site/security?lang=${lang}`}
            className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            {t.nav.security}
          </Link>
          <Link
            href={`/site/contact?lang=${lang}`}
            className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            {t.nav.contact}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/login"
            className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 md:inline-flex"
          >
            {t.nav.login}
          </Link>
          <Link
            href={`/site/contact?lang=${lang}`}
            className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-500"
          >
            {t.nav.demo}
          </Link>
        </div>
      </div>
    </header>
  );
}