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

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  impactWeight: z.number().min(IMPACT_WEIGHT_MIN).max(IMPACT_WEIGHT_MAX),
  difficultyWeight: z.number().min(DIFFICULTY_WEIGHT_MIN).max(DIFFICULTY_WEIGHT_MAX),
  businessValueWeight: z.number().min(BUSINESS_VALUE_WEIGHT_MIN).max(BUSINESS_VALUE_WEIGHT_MAX),
  status: z.enum(["draft", "in_progress", "done"]).default("draft"),
  contributions: z
    .array(
      z.object({ memberId: z.string(), contributionPercent: z.number().min(0).max(100) })
    )
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const features = await prisma.feature.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
      weightVotes: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(features);
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!userId || !["FOUNDER", "ADMIN"].includes(role ?? "")) {
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
  const { title, description, impactWeight, difficultyWeight, businessValueWeight, status, contributions } =
    parsed.data;
  const sum = (contributions ?? []).reduce((a, c) => a + c.contributionPercent, 0);
  if ((contributions ?? []).length > 0 && sum !== 100) {
    return NextResponse.json(
      { error: "Contribution percents must sum to 100" },
      { status: 400 }
    );
  }
  const feature = await prisma.feature.create({
    data: {
      title,
      description: description ?? null,
      impactWeight,
      difficultyWeight,
      businessValueWeight,
      status,
      createdBy: { connect: { id: userId } },
      contributions:
        contributions && contributions.length > 0
          ? {
              create: contributions.map((c) => ({
                memberId: c.memberId,
                contributionPercent: c.contributionPercent,
              })),
            }
          : undefined,
    },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(feature);
}
