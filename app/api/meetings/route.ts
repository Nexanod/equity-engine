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

const createSchema = z.object({
  topic: z.string().min(1),
  importanceWeight: z.number().min(MEETING_IMPORTANCE_MIN).max(MEETING_IMPORTANCE_MAX),
  contributions: z.array(contributionSchema).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const meetings = await prisma.meeting.findMany({
    orderBy: { heldAt: "desc" },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(meetings);
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
  const meeting = await prisma.meeting.create({
    data: {
      topic: parsed.data.topic,
      importanceWeight: parsed.data.importanceWeight,
      contributions: {
        create: parsed.data.contributions.map((c) => ({
          memberId: c.memberId,
          contributionLevel: c.contributionLevel,
        })),
      },
    },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  return NextResponse.json(meeting);
}
