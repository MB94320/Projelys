// uiColors.ts
export const STATUS_COLORS = {
  Ouverte: "bg-rose-100 text-rose-700 border border-rose-200",
  "En cours": "bg-amber-100 text-amber-700 border border-amber-200",
  Terminée: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Annulée: "bg-slate-100 text-slate-700 border border-slate-200",
} as const;

export const ORIGIN_COLORS = {
  Commerce: "bg-amber-100 text-amber-800 border border-amber-200",
  Exigence: "bg-sky-100 text-sky-800 border border-sky-200",
  "Non-Conformité": "bg-orange-100 text-orange-800 border border-orange-200",
  Risques: "bg-purple-100 text-purple-800 border border-purple-200",
  "Revue interne": "bg-teal-100 text-teal-800 border border-teal-200",
  "Revue Client": "bg-lime-100 text-lime-800 border border-lime-200",
  Qualité: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  "Audit Interne": "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200",
  "Audit Externe": "bg-cyan-100 text-cyan-800 border border-cyan-200",
  KoM: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  CoPil: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  CoDir: "bg-rose-100 text-rose-800 border border-rose-200",
  Autres: "bg-slate-100 text-slate-800 border border-slate-200",
} as const;
