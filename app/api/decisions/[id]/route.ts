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

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  importanceWeight: z.number().min(DECISION_IMPORTANCE_MIN).max(DECISION_IMPORTANCE_MAX).optional(),
  contributions: z.array(contributionSchema).min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["FOUNDER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const decision = await prisma.decision.findUnique({ where: { id } });
  if (!decision) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }
  const data: {
    title?: string;
    description?: string | null;
    importanceWeight?: number;
    contributions?: { deleteMany: {} } | { create: { memberId: string; influenceLevel: number }[] };
  } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description ?? null;
  if (parsed.data.importanceWeight !== undefined) data.importanceWeight = parsed.data.importanceWeight;
  if (parsed.data.contributions !== undefined) {
    await prisma.decisionContribution.deleteMany({ where: { decisionId: id } });
    data.contributions = {
      create: parsed.data.contributions.map((c) => ({
        memberId: c.memberId,
        influenceLevel: c.influenceLevel,
      })),
    };
  }
  const updated = await prisma.decision.update({
    where: { id },
    data,
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !["FOUNDER", "ADMIN"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.decision.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
