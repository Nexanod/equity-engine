import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SEVERITY_MIN, SEVERITY_MAX, IMPACT_WEIGHT_MIN, IMPACT_WEIGHT_MAX } from "@/lib/constants";

const createSchema = z.object({
  title: z.string().optional(),
  severity: z.number().min(SEVERITY_MIN).max(SEVERITY_MAX),
  impactWeight: z.number().min(IMPACT_WEIGHT_MIN).max(5), // bugs use 1-5 for impact
  resolvedById: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bugs = await prisma.bugFix.findMany({
    orderBy: { resolvedAt: "desc" },
    include: { member: { select: { id: true, name: true } } },
  });
  return NextResponse.json(bugs);
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
  const resolvedById = parsed.data.resolvedById ?? userId;
  const bug = await prisma.bugFix.create({
    data: {
      title: parsed.data.title ?? null,
      severity: parsed.data.severity,
      impactWeight: parsed.data.impactWeight,
      resolvedById,
    },
    include: { member: { select: { id: true, name: true } } },
  });
  return NextResponse.json(bug);
}
