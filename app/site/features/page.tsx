import MarketingShell from "@/app/components/marketing/MarketingShell";
import FeaturesHero from "@/app/components/marketing/FeaturesHero";
import FeaturesGrid from "@/app/components/marketing/FeaturesGrid";
import FeaturesStoryBands from "@/app/components/marketing/FeaturesStoryBands";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function FeaturesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <FeaturesHero lang={lang} />
      <FeaturesGrid lang={lang} />
      <FeaturesStoryBands lang={lang} />
    </MarketingShell>
  );
}
