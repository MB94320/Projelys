// app/projects/[id]/quality/ExportNc8dPdfButton.tsx
"use client";

import { useState } from "react";

type ExportNc8dPdfButtonProps = {
  projectId: number | string;
  ncId: number | string;
};

export function ExportNc8dPdfButton({
  projectId,
  ncId,
}: ExportNc8dPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/projects/${projectId}/quality/export-nc-pdf?ncId=${ncId}`,
      );
      if (!res.ok) {
        alert("Erreur lors de l'export PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fiche8D_NC_${ncId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExportPDF}
      disabled={loading}
      className="text-[11px] text-rose-600 hover:underline disabled:opacity-50 disabled:cursor-wait"
    >
      {loading ? "Export…" : "Fiche 8D (pdf)"}
    </button>
  );
}
