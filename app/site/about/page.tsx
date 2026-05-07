import MarketingShell from "@/app/components/marketing/MarketingShell";
import AboutHero from "@/app/components/marketing/AboutHero";
import AboutStory from "@/app/components/marketing/AboutStory";
import AboutPrinciples from "@/app/components/marketing/AboutPrinciples";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function AboutPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <AboutHero lang={lang} />
      <AboutStory lang={lang} />
      <AboutPrinciples lang={lang} />
    </MarketingShell>
  );
}