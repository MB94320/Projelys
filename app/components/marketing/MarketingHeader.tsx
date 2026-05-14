"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageToggle from "./LanguageToggle";
import { Lang, content } from "./marketing-content";

export default function MarketingHeader({ lang }: { lang: Lang }) {
  const t = content[lang];
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDiscoverOpen, setMobileDiscoverOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      setMobileDiscoverOpen(false);
    }
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/92">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/site?lang=${lang}`}
          className="flex min-w-0 shrink-0 items-center gap-3"
          onClick={() => {
            setOpen(false);
            setMobileOpen(false);
          }}
        >
          <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
            <Image
              src="/PROJELYS.png"
              alt="Projelys"
              width={40}
              height={40}
              className="h-[40px] w-[40px] object-contain"
              priority
            />
          </div>

          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-[13px] font-bold uppercase tracking-[0.08em] text-slate-950 dark:text-white">
              Projelys
            </div>
            <div className="truncate text-[11px] text-slate-600 dark:text-slate-300">
              Project Portfolio & Performance Control
            </div>
          </div>
        </Link>

        <nav className="ml-4 hidden items-center gap-7 lg:flex">
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

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggle />

          <Link
            href={`/site/contact?lang=${lang}`}
            className="inline-flex rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-500 sm:text-sm"
          >
            {t.nav.demo}
          </Link>

          <Link
            href={`/login?lang=${lang}`}
            className="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 md:inline-flex"
          >
            {t.nav.login}
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label={lang === "fr" ? "Ouvrir le menu" : "Open menu"}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[360px] flex-col overflow-hidden border-r border-slate-700 bg-slate-100 shadow-2xl dark:bg-slate-900">
            <div className="border-b border-slate-300 bg-slate-200/95 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src="/PROJELYS.png"
                    alt="Projelys"
                    width={42}
                    height={42}
                    className="h-10 w-10 rounded-xl bg-white object-contain p-1 shadow-sm dark:bg-slate-800"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-white">
                      Projelys
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {lang === "fr" ? "Navigation du site" : "Site navigation"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label={lang === "fr" ? "Fermer le menu" : "Close menu"}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-b border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="rounded-2xl border border-slate-300 bg-slate-200 px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {lang === "fr" ? "Accès rapide" : "Quick access"}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {lang === "fr"
                    ? "Retrouve les pages clés du site, avec un menu lisible et visible sur mobile."
                    : "Reach the key website pages with a readable mobile sidebar."}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100 px-3 py-4 dark:bg-slate-900">
              <nav className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMobileDiscoverOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <span>{lang === "fr" ? "Découvrir" : "Explore"}</span>
                  <svg
                    className={`h-4 w-4 transition ${mobileDiscoverOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {mobileDiscoverOpen && (
                  <div className="ml-1 space-y-2 border-l-2 border-slate-300 pl-3 dark:border-slate-700">
                    <Link
                      href={`/site/how-it-works?lang=${lang}`}
                      onClick={() => {
                        setMobileDiscoverOpen(false);
                        setMobileOpen(false);
                      }}
                      className="block rounded-xl bg-cyan-50 px-3 py-3 text-sm font-medium text-slate-800 hover:bg-cyan-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      {lang === "fr" ? "Méthode de pilotage" : "How it works"}
                    </Link>

                    <Link
                      href={`/site/about?lang=${lang}`}
                      onClick={() => {
                        setMobileDiscoverOpen(false);
                        setMobileOpen(false);
                      }}
                      className="block rounded-xl bg-fuchsia-50 px-3 py-3 text-sm font-medium text-slate-800 hover:bg-fuchsia-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      {lang === "fr" ? "À propos" : "About"}
                    </Link>
                  </div>
                )}

                <Link
                  href={`/site/features?lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t.nav.features}
                </Link>

                <Link
                  href={`/site/pricing?lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t.nav.pricing}
                </Link>

                <Link
                  href={`/site/security?lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t.nav.security}
                </Link>

                <Link
                  href={`/site/contact?lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  {t.nav.contact}
                </Link>
              </nav>
            </div>

            <div className="border-t border-slate-300 bg-slate-200 px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="space-y-2">
                <Link
                  href={`/login?lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t.nav.login}
                </Link>

                <Link
                  href={`/site/contact?lang=${lang}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl bg-sky-600 px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm shadow-sky-600/25 hover:bg-sky-500"
                >
                  {t.nav.demo}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}