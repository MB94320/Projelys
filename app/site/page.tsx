import MarketingShell from "@/app/components/marketing/MarketingShell";
import HomeHero from "@/app/components/marketing/HomeHero";
import HomeKpis from "@/app/components/marketing/HomeKpis";
import HomeFeatureBands from "@/app/components/marketing/HomeFeatureBands";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function SiteHomePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <HomeHero lang={lang} />
      <HomeKpis lang={lang} />
      <HomeFeatureBands lang={lang} />
    </MarketingShell>
  );
}