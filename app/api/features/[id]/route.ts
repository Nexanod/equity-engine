import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { FeatureStatus } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  impactWeight: z.number().min(1).max(10).optional(),
  difficultyWeight: z.number().min(1).max(5).optional(),
  businessValueWeight: z.number().min(1).max(10).optional(),
  status: z.enum(["draft", "in_progress", "done"]).optional(),
  contributions: z
    .array(
      z.object({ memberId: z.string(), contributionPercent: z.number().min(0).max(100) })
    )
    .optional(),
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
  const feature = await prisma.feature.findUnique({ where: { id } });
  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }
  const updates: {
    title?: string;
    description?: string | null;
    impactWeight?: number;
    difficultyWeight?: number;
    businessValueWeight?: number;
    status?: FeatureStatus;
    completedAt?: Date;
    weightsLocked?: boolean;
  } = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description ?? null;
  if (parsed.data.status) {
    updates.status = parsed.data.status as FeatureStatus;
    if (parsed.data.status === "done") {
      updates.completedAt = new Date();
      updates.weightsLocked = true;
    }
  }
  if (!feature.weightsLocked) {
    if (parsed.data.impactWeight !== undefined) updates.impactWeight = parsed.data.impactWeight;
    if (parsed.data.difficultyWeight !== undefined) updates.difficultyWeight = parsed.data.difficultyWeight;
    if (parsed.data.businessValueWeight !== undefined) updates.businessValueWeight = parsed.data.businessValueWeight;
  } else if (
    parsed.data.impactWeight !== undefined ||
    parsed.data.difficultyWeight !== undefined ||
    parsed.data.businessValueWeight !== undefined
  ) {
    return NextResponse.json(
      { error: "Weights are locked for this feature" },
      { status: 400 }
    );
  }
  if (parsed.data.contributions !== undefined) {
    const sum = parsed.data.contributions.reduce((a, c) => a + c.contributionPercent, 0);
    if (sum !== 100) {
      return NextResponse.json(
        { error: "Contribution percents must sum to 100" },
        { status: 400 }
      );
    }
    await prisma.featureContribution.deleteMany({ where: { featureId: id } });
    await prisma.featureContribution.createMany({
      data: parsed.data.contributions.map((c) => ({
        featureId: id,
        memberId: c.memberId,
        contributionPercent: c.contributionPercent,
      })),
    });
  }
  const updated = await prisma.feature.update({
    where: { id },
    data: updates,
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
  await prisma.feature.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
