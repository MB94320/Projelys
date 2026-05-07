import MarketingShell from "@/app/components/marketing/MarketingShell";
import PricingHero from "@/app/components/marketing/PricingHero";
import PricingPlans from "@/app/components/marketing/PricingPlans";
import PricingFaq from "@/app/components/marketing/PricingFaq";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function PricingPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <PricingHero lang={lang} />
      <PricingPlans lang={lang} />
      <PricingFaq lang={lang} />
    </MarketingShell>
  );
}