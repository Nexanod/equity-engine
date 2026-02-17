import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { computeAllMemberScores } from "@/lib/db";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { scores, equityPercents, totalScore } =
    await computeAllMemberScores();
  const members = await prisma.member.findMany({
    where: { id: { in: Object.keys(scores) } },
    select: { id: true, name: true, email: true },
  });
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const breakdown = Object.entries(scores).map(([memberId, s]) => ({
    memberId,
    name: byId[memberId]?.name ?? "Unknown",
    ...s,
    equityPercent: equityPercents[memberId] ?? 0,
  }));
  return NextResponse.json({
    totalScore,
    equityPercents,
    breakdown,
    scores,
  });
}
