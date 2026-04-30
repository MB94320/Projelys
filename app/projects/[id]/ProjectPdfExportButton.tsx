"use client";

type Props = {
  projectId: number;
};

export default function ProjectPdfExportButton({ projectId }: Props) {
  const handleDownloadPdf = () => {
    window.open(`/api/export/project-pdf?id=${projectId}`, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handleDownloadPdf}
      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
    >
      Export PDF
    </button>
  );
}
