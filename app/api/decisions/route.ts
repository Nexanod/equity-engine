import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  DECISION_IMPORTANCE_MIN,
  DECISION_IMPORTANCE_MAX,
  INFLUENCE_LEVEL_MIN,
  INFLUENCE_LEVEL_MAX,
} from "@/lib/constants";

const contributionSchema = z.object({
  memberId: z.string(),
  influenceLevel: z.number().min(INFLUENCE_LEVEL_MIN).max(INFLUENCE_LEVEL_MAX),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  importanceWeight: z.number().min(DECISION_IMPORTANCE_MIN).max(DECISION_IMPORTANCE_MAX),
  contributions: z.array(contributionSchema).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decisions = await prisma.decision.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(decisions);
}

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
  const decision = await prisma.decision.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      importanceWeight: parsed.data.importanceWeight,
      contributions: {
        create: parsed.data.contributions.map((c) => ({
          memberId: c.memberId,
          influenceLevel: c.influenceLevel,
        })),
      },
    },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(decision);
}
