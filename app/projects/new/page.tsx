"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();

  const [projectNumber, setProjectNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectManagerName, setProjectManagerName] = useState("");
  const [titleProject, setTitleProject] = useState("");
  const [status, setStatus] = useState("Planifié");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectNumber,
          clientName,
          projectManagerName,
          titleProject,
          status,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la création du projet");
      }

      router.push("/projects");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex flex-1">
        <section className="flex-1 p-6 max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-slate-900 mb-4">
            Nouveau projet
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700">
                N° projet
              </label>
              <input
                type="text"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                placeholder="P-2025-001"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Client
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Nom du client"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Chef de projet
                </label>
                <input
                  type="text"
                  value={projectManagerName}
                  onChange={(e) => setProjectManagerName(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                  placeholder="Nom du chef de projet"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Intitulé du projet
              </label>
              <input
                type="text"
                value={titleProject}
                onChange={(e) => setTitleProject(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                placeholder="Titre court du projet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              >
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => router.push("/projects")}
                className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer le projet"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
