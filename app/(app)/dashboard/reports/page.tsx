import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CreateSnapshotForm } from "./CreateSnapshotForm";
import { ExportCSVButton } from "./ExportCSVButton";
import { computeAllMemberScores } from "@/lib/db";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const snapshots = await prisma.equitySnapshot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      entries: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  const { breakdown } = await (async () => {
    const { scores, equityPercents } = await computeAllMemberScores();
    const members = await prisma.member.findMany({
      where: { id: { in: Object.keys(scores) } },
      select: { id: true, name: true },
    });
    const byId = Object.fromEntries(members.map((m) => [m.id, m]));
    return {
      breakdown: Object.entries(scores).map(([memberId, s]) => ({
        memberId,
        name: byId[memberId]?.name ?? "Unknown",
        ...s,
        equityPercent: equityPercents[memberId] ?? 0,
      })),
    };
  })();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="mt-1 text-zinc-400">
            Quarterly snapshots and export contribution breakdown to CSV.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportCSVButton breakdown={breakdown} />
          <CreateSnapshotForm />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-white">Equity snapshots (quarterly freeze)</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="px-4 py-3 font-medium text-zinc-300">Period</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Created</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Entries</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{s.periodLabel}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {s.entries.map((e) => (
                      <span key={e.id} className="mr-2">
                        {e.member.name}: {Number(e.equityPercent)}%
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
