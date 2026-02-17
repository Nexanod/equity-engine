import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { SEVERITY_MIN, SEVERITY_MAX } from "@/lib/constants";

const updateSchema = z.object({
  title: z.string().optional().nullable(),
  severity: z.number().min(SEVERITY_MIN).max(SEVERITY_MAX).optional(),
  impactWeight: z.number().min(1).max(5).optional(),
  resolvedById: z.string().optional(),
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
  const bug = await prisma.bugFix.findUnique({ where: { id } });
  if (!bug) {
    return NextResponse.json({ error: "Bug not found" }, { status: 404 });
  }
  const updated = await prisma.bugFix.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title ?? null }),
      ...(parsed.data.severity !== undefined && { severity: parsed.data.severity }),
      ...(parsed.data.impactWeight !== undefined && { impactWeight: parsed.data.impactWeight }),
      ...(parsed.data.resolvedById !== undefined && { resolvedById: parsed.data.resolvedById }),
    },
    include: { member: { select: { id: true, name: true } } },
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
  await prisma.bugFix.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
