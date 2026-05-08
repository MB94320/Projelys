"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import LanguageToggle from "./LanguageToggle";
import { Lang, content } from "./marketing-content";

export default function MarketingHeader({ lang }: { lang: Lang }) {
  const t = content[lang];
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          href={`/site?lang=${lang}`}
          className="flex min-w-0 items-center gap-3"
        >
          <Image
            src="/PROJELYS.png"
            alt="Projelys"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
              Projelys
            </div>
            <div className="truncate text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              Project Portfolio & Performance Control
            </div>
          </div>
        </Link>

        {/* Nav desktop */}
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
                <path
                  d="M5 7.5 10 12.5 15 7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
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

        {/* Actions + menu mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle />

          {/* CTA visible partout */}
          <Link
            href={`/site/contact?lang=${lang}`}
            className="inline-flex rounded-xl bg-sky-600 px-3 py-2 text-xs sm:text-sm font-medium text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-500"
          >
            {t.nav.demo}
          </Link>

          {/* Connexion desktop */}
          <Link
            href="/login"
            className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 md:inline-flex"
          >
            {t.nav.login}
          </Link>

          {/* Bouton menu mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile plein écran */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[80vw] max-w-xs bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Fermer le menu"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <span>{lang === "fr" ? "Découvrir" : "Explore"}</span>
                <svg
                  className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M5 7.5 10 12.5 15 7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {open && (
                <div className="ml-2 space-y-1">
                  <Link
                    href={`/site/how-it-works?lang=${lang}`}
                    onClick={() => {
                      setOpen(false);
                      setMobileOpen(false);
                    }}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    {lang === "fr"
                      ? "Méthode de pilotage"
                      : "How it works"}
                  </Link>
                  <Link
                    href={`/site/about?lang=${lang}`}
                    onClick={() => {
                      setOpen(false);
                      setMobileOpen(false);
                    }}
                    className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-fuchsia-50 dark:text-slate-100 dark:hover:bg-slate-900"
                  >
                    {lang === "fr" ? "À propos" : "About"}
                  </Link>
                </div>
              )}

              <Link
                href={`/site/features?lang=${lang}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t.nav.features}
              </Link>
              <Link
                href={`/site/pricing?lang=${lang}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t.nav.pricing}
              </Link>
              <Link
                href={`/site/security?lang=${lang}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t.nav.security}
              </Link>
              <Link
                href={`/site/contact?lang=${lang}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t.nav.contact}
              </Link>
            </div>

            <div className="mt-2 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t.nav.login}
              </Link>
              <Link
                href={`/site/contact?lang=${lang}`}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-medium text-white shadow-sm shadow-sky-600/25 hover:bg-sky-500"
              >
                {t.nav.demo}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}