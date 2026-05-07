import MarketingShell from "@/app/components/marketing/MarketingShell";
import ContactHero from "@/app/components/marketing/ContactHero";
import ContactFormSection from "@/app/components/marketing/ContactFormSection";
import ContactHelp from "@/app/components/marketing/ContactHelp";

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function ContactPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const lang = params.lang === "en" ? "en" : "fr";

  return (
    <MarketingShell lang={lang}>
      <ContactHero lang={lang} />
      <ContactFormSection lang={lang} />
      <ContactHelp lang={lang} />
    </MarketingShell>
  );
}