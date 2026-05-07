import MarketingShell from "@/app/components/marketing/MarketingShell";
import HowItWorksHero from "@/app/components/marketing/HowItWorksHero";
import HowItWorksFlow from "@/app/components/marketing/HowItWorksFlow";
import HowItWorksTutorials from "@/app/components/marketing/HowItWorksTutorials";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function HowItWorksPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <HowItWorksHero lang={lang} />
      <HowItWorksFlow lang={lang} />
      <HowItWorksTutorials lang={lang} />
    </MarketingShell>
  );
}