import MarketingShell from "@/app/components/marketing/MarketingShell";
import SecurityHero from "@/app/components/marketing/SecurityHero";
import SecurityPillars from "@/app/components/marketing/SecurityPillars";
import SecurityDetails from "@/app/components/marketing/SecurityDetails";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function SecurityPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <SecurityHero lang={lang} />
      <SecurityPillars lang={lang} />
      <SecurityDetails lang={lang} />
    </MarketingShell>
  );
}