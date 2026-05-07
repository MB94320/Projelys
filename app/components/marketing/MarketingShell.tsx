import { ReactNode } from "react";
import MarketingHeader from "@/app/components/marketing/MarketingHeader";
import MarketingFooter from "@/app/components/marketing/MarketingFooter";
import { Lang } from "@/app/components/marketing/marketing-content";

export default function MarketingShell({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <MarketingHeader lang={lang} />
      <main>{children}</main>
      <MarketingFooter lang={lang} />
    </div>
  );
}