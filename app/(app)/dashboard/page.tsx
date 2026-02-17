import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { EquityDashboard } from "./EquityDashboard";
import { computeAllMemberScores } from "@/lib/db";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { scores, equityPercents, totalScore } = await computeAllMemberScores();
  const members = await prisma.member.findMany({
    where: { id: { in: Object.keys(scores) } },
    select: { id: true, name: true },
  });
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const breakdown = Object.entries(scores).map(([memberId, s]) => ({
    memberId,
    name: byId[memberId]?.name ?? "Unknown",
    ...s,
    equityPercent: equityPercents[memberId] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Equity Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Live contribution scores and equity split. Transparent and fair.
        </p>
      </div>
      <EquityDashboard breakdown={breakdown} totalScore={totalScore} />
    </div>
  );
}
