"use client";

type ExportPdfButtonProps = {
  projectId: number | string;
};

export function ExportPdfButton({ projectId }: ExportPdfButtonProps) {
  const handleExportPDF = () => {
    window.location.href = `/api/export/project-html?id=${projectId}`;
  };

  return (
    <button
      type="button"
      onClick={handleExportPDF}
      className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white"
    >
      Export PDF
    </button>
  );
}
