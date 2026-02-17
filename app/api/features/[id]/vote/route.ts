import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  IMPACT_WEIGHT_MAX,
  IMPACT_WEIGHT_MIN,
  DIFFICULTY_WEIGHT_MAX,
  DIFFICULTY_WEIGHT_MIN,
  BUSINESS_VALUE_WEIGHT_MAX,
  BUSINESS_VALUE_WEIGHT_MIN,
} from "@/lib/constants";

const voteSchema = z.object({
  impactWeight: z.number().min(IMPACT_WEIGHT_MIN).max(IMPACT_WEIGHT_MAX),
  difficultyWeight: z.number().min(DIFFICULTY_WEIGHT_MIN).max(DIFFICULTY_WEIGHT_MAX),
  businessValueWeight: z.number().min(BUSINESS_VALUE_WEIGHT_MIN).max(BUSINESS_VALUE_WEIGHT_MAX),
});

// Anti-gaming: submit your vote for feature weights (majority or average can then set the feature weights)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: featureId } = await params;
  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const feature = await prisma.feature.findUnique({ where: { id: featureId } });
  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }
  if (feature.weightsLocked) {
    return NextResponse.json(
      { error: "Weights are locked for this feature" },
      { status: 400 }
    );
  }
  await prisma.featureWeightVote.upsert({
    where: {
      featureId_memberId: { featureId, memberId: userId },
    },
    create: {
      featureId,
      memberId: userId,
      impactWeight: parsed.data.impactWeight,
      difficultyWeight: parsed.data.difficultyWeight,
      businessValueWeight: parsed.data.businessValueWeight,
    },
    update: {
      impactWeight: parsed.data.impactWeight,
      difficultyWeight: parsed.data.difficultyWeight,
      businessValueWeight: parsed.data.businessValueWeight,
    },
  });
  return NextResponse.json({ ok: true });
}
