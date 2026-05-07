import Image from "next/image";
import Link from "next/link";
import { Lang, content } from "./marketing-content";

function SocialIcon({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:scale-105 ${className}`}
    >
      {children}
    </Link>
  );
}

export default function MarketingFooter({ lang }: { lang: Lang }) {
  const t = content[lang];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <Link href={`/site?lang=${lang}`} className="flex items-center gap-3">
              <Image
                src="/PROJELYS.png"
                alt="Projelys"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl object-contain"
              />
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-900 dark:text-white">
                  Projelys
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Project Portfolio & Performance Control
                </div>
              </div>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "La plateforme pour structurer le pilotage, accélérer les arbitrages et mieux maîtriser l’exécution."
                : "The platform to structure governance, speed up decisions and improve execution control."}
            </p>
          </div>

          {/* NAVIGATION */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Navigation
            </h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Link
                href={`/site?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {lang === "fr" ? "Accueil" : "Home"}
              </Link>
              <Link
                href={`/site/features?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.nav.features}
              </Link>
              <Link
                href={`/site/pricing?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.nav.pricing}
              </Link>
              <Link
                href={`/site/contact?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.nav.contact}
              </Link>
            </div>
          </div>


          {/* RESSOURCES */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === "fr" ? "Ressources" : "Resources"}
            </h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Link
                href={`/site/security?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.nav.security}
              </Link>
              <Link
                href={`/site/legal/terms?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.footer.terms}
              </Link>
              <Link
                href={`/site/legal/privacy?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.footer.privacy}
              </Link>
              <Link
                href="/login"
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {t.nav.login}
              </Link>
            </div>
          </div>

          {/* PRODUIT */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === "fr" ? "Produit" : "Product"}
            </h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400">              
              <Link
                href={`/site/how-it-works?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {lang === "fr" ? "Méthode de pilotage" : "How it works"}
              </Link>              
              <Link
                href={`/site/about?lang=${lang}`}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {lang === "fr" ? "À propos" : "About"}
              </Link>
            </div>
          </div>
          {/* SOCIAL */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.footer.social}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <SocialIcon
                href="https://www.linkedin.com"
                label="LinkedIn"
                className="bg-[#0A66C2] text-white hover:opacity-90"
              >
                <span className="text-sm font-bold">in</span>
              </SocialIcon>

              <SocialIcon
                href="https://www.facebook.com"
                label="Facebook"
                className="bg-[#1877F2] text-white hover:opacity-90"
              >
                <span className="text-base font-bold">f</span>
              </SocialIcon>

              <SocialIcon
                href="https://www.instagram.com"
                label="Instagram"
                className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:opacity-90"
              >
                <span className="text-[11px] font-bold uppercase">ig</span>
              </SocialIcon>

              <SocialIcon
                href="https://x.com"
                label="X"
                className="bg-black text-white hover:opacity-90"
              >
                <span className="text-sm font-bold text-white">X</span>
              </SocialIcon>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800">
          <div className="flex flex-col gap-3 text-xs text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
            <p>{t.footer.rights}</p>
            <p>
              {lang === "fr"
                ? "Une seule plateforme pour piloter, arbitrer et sécuriser l’exécution."
                : "One platform to govern, arbitrate and secure execution."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}