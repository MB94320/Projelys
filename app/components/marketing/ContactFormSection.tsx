"use client";

import { useState } from "react";
import { Lang } from "./marketing-content";

export default function ContactFormSection({ lang }: { lang: Lang }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    context: "",
    priority: "",
    website: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          lang,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(
          data?.error ||
            (lang === "fr"
              ? "Une erreur est survenue."
              : "Something went wrong.")
        );
        setLoading(false);
        return;
      }

      setSent(true);
      setForm({
        name: "",
        email: "",
        company: "",
        context: "",
        priority: "",
        website: "",
      });
    } catch {
      setError(
        lang === "fr"
          ? "Impossible d’envoyer le message."
          : "Unable to send the message."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            {lang === "fr" ? "Envoyer un message" : "Send a message"}
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Expliquez brièvement votre contexte, vos enjeux et ce que vous aimeriez voir."
              : "Briefly describe your context, your needs and what you would like to see."}
          </p>

          <input
            type="text"
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
          />

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2 text-sm">
              <label className="font-medium text-slate-800 dark:text-slate-100">
                {lang === "fr" ? "Nom / Prénom" : "Name"}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-2 text-sm">
              <label className="font-medium text-slate-800 dark:text-slate-100">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-2 text-sm">
              <label className="font-medium text-slate-800 dark:text-slate-100">
                {lang === "fr" ? "Société (optionnel)" : "Company (optional)"}
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-2 text-sm">
              <label className="font-medium text-slate-800 dark:text-slate-100">
                {lang === "fr" ? "Priorité / besoin" : "Priority / need"}
              </label>
              <input
                type="text"
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
                placeholder={
                  lang === "fr"
                    ? "Ex. démo, portefeuille, charge, qualité, performance…"
                    : "E.g. demo, portfolio, workload, quality, performance…"
                }
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid gap-2 text-sm">
              <label className="font-medium text-slate-800 dark:text-slate-100">
                {lang === "fr" ? "Contexte" : "Context"}
              </label>
              <textarea
                rows={5}
                required
                value={form.context}
                onChange={(e) => updateField("context", e.target.value)}
                className="resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder={
                  lang === "fr"
                    ? "Votre activité, votre organisation, vos enjeux actuels de pilotage…"
                    : "Your activity, your organization, your current governance needs…"
                }
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? lang === "fr"
                ? "Envoi..."
                : "Sending..."
              : lang === "fr"
              ? "Envoyer"
              : "Send"}
          </button>

          {sent && (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
              {lang === "fr"
                ? "Message envoyé avec succès."
                : "Message sent successfully."}
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            {lang === "fr" ? "Démo, support et retours" : "Demo, support and feedback"}
          </h2>

          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>
              {lang === "fr"
                ? "Vous pouvez utiliser ce formulaire pour demander une démo, poser une question produit ou partager un besoin métier."
                : "You can use this form to request a demo, ask a product question or share a business need."}
            </p>
            <p>
              {lang === "fr"
                ? "Projelys évolue avec les retours terrain. Les besoins concrets de pilotage, de ressources, de qualité, de risques et de performance sont particulièrement utiles."
                : "Projelys evolves with field feedback. Real governance, resources, quality, risks and performance needs are especially useful."}
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <div className="font-medium text-slate-900 dark:text-white">
              {lang === "fr" ? "Contact direct" : "Direct contact"}
            </div>
            <div className="mt-1">
              <a
                href="mailto:contact@projelys.app"
                className="text-sky-700 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200"
              >
                contact@projelys.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}