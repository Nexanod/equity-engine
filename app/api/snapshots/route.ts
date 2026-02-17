import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeAllMemberScores } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  periodLabel: z.string().min(1), // e.g. "2025-Q1"
});

// List snapshots
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshots = await prisma.equitySnapshot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      entries: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(snapshots);
}

// Create quarterly snapshot (freeze current equity)
export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["FOUNDER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { scores, equityPercents } = await computeAllMemberScores();
  const snapshot = await prisma.equitySnapshot.create({
    data: {
      periodLabel: parsed.data.periodLabel,
      entries: {
        create: Object.entries(scores).map(([memberId, s]) => ({
          memberId,
          equityPercent: equityPercents[memberId] ?? 0,
          totalScore: s.total,
          featureScore: s.featureScore,
          bugScore: s.bugScore,
          meetingScore: s.meetingScore,
          decisionScore: s.decisionScore,
        })),
      },
    },
    include: {
      entries: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(snapshot);
}
