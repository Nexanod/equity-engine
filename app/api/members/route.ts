import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["FOUNDER", "ADMIN", "VIEWER"]).default("VIEWER"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const members = await prisma.member.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      joinedAt: true,
      status: true,
    },
  });
  return NextResponse.json(members);
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
  const { name, email, password, role: newRole } = parsed.data;
  const passwordHash = password
    ? await import("bcryptjs").then((b) => b.hash(password, 10))
    : null;
  const member = await prisma.member.create({
    data: { name, email, passwordHash, role: newRole },
    select: { id: true, name: true, email: true, role: true, joinedAt: true },
  });
  return NextResponse.json(member);
}
