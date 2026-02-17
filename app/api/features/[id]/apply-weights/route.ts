import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Anti-gaming: Set feature weights from the average of all founders' votes.
 * Only Founder/Admin can trigger. Weights are applied only if not locked.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["FOUNDER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const feature = await prisma.feature.findUnique({
    where: { id },
    include: { weightVotes: true },
  });
  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }
  if (feature.weightsLocked) {
    return NextResponse.json(
      { error: "Weights are locked for this feature" },
      { status: 400 }
    );
  }
  if (feature.weightVotes.length === 0) {
    return NextResponse.json(
      { error: "No votes to apply. Ask founders to submit weight votes." },
      { status: 400 }
    );
  }
  const n = feature.weightVotes.length;
  const impactWeight = Math.round(
    feature.weightVotes.reduce((a, v) => a + v.impactWeight, 0) / n
  );
  const difficultyWeight = Math.round(
    feature.weightVotes.reduce((a, v) => a + v.difficultyWeight, 0) / n
  );
  const businessValueWeight = Math.round(
    feature.weightVotes.reduce((a, v) => a + v.businessValueWeight, 0) / n
  );
  const updated = await prisma.feature.update({
    where: { id },
    data: {
      impactWeight: Math.max(1, Math.min(10, impactWeight)),
      difficultyWeight: Math.max(1, Math.min(5, difficultyWeight)),
      businessValueWeight: Math.max(1, Math.min(10, businessValueWeight)),
    },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(updated);
}
