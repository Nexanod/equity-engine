import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  MEETING_IMPORTANCE_MIN,
  MEETING_IMPORTANCE_MAX,
  CONTRIBUTION_LEVEL_MIN,
  CONTRIBUTION_LEVEL_MAX,
} from "@/lib/constants";

const contributionSchema = z.object({
  memberId: z.string(),
  contributionLevel: z.number().min(CONTRIBUTION_LEVEL_MIN).max(CONTRIBUTION_LEVEL_MAX),
});

const updateSchema = z.object({
  topic: z.string().min(1).optional(),
  importanceWeight: z.number().min(MEETING_IMPORTANCE_MIN).max(MEETING_IMPORTANCE_MAX).optional(),
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
  const meeting = await prisma.meeting.findUnique({ where: { id } });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (parsed.data.contributions !== undefined) {
    await prisma.meetingContribution.deleteMany({ where: { meetingId: id } });
  }
  const data: { topic?: string; importanceWeight?: number; contributions?: { create: { memberId: string; contributionLevel: number }[] } } = {};
  if (parsed.data.topic !== undefined) data.topic = parsed.data.topic;
  if (parsed.data.importanceWeight !== undefined) data.importanceWeight = parsed.data.importanceWeight;
  if (parsed.data.contributions !== undefined) {
    data.contributions = {
      create: parsed.data.contributions.map((c) => ({
        memberId: c.memberId,
        contributionLevel: c.contributionLevel,
      })),
    };
  }
  const updated = await prisma.meeting.update({
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
  await prisma.meeting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
