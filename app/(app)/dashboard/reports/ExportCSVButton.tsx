"use client";

type BreakdownItem = {
  memberId: string;
  name: string;
  featureScore: number;
  bugScore: number;
  meetingScore: number;
  decisionScore: number;
  total: number;
  equityPercent: number;
};

export function ExportCSVButton({ breakdown }: { breakdown: BreakdownItem[] }) {
  function download() {
    const headers = ["Member", "Equity %", "Total", "Features", "Bugs", "Meetings", "Decisions"];
    const rows = breakdown.map((b) => [
      b.name,
      b.equityPercent,
      Math.round(b.total * 100) / 100,
      Math.round(b.featureScore * 100) / 100,
      Math.round(b.bugScore * 100) / 100,
      Math.round(b.meetingScore * 100) / 100,
      Math.round(b.decisionScore * 100) / 100,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equity-breakdown-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
    >
      Export CSV
    </button>
  );
}
