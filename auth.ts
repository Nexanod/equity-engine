import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const member = await prisma.member.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!member?.passwordHash) return null;
        const ok = await bcrypt.compare(
          String(credentials.password),
          member.passwordHash
        );
        if (!ok) return null;
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
};

/** Get the current session (NextAuth v4 – use in Server Components / Route Handlers). */
export async function auth() {
  return getServerSession(authOptions);
}

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
};

export function requireRole(allowed: string[]) {
  return async () => {
    const session = await auth();
    if (!session?.user) return null;
    const role = (session.user as SessionUser).role;
    if (!role || !allowed.includes(role)) return null;
    return session;
  };
}
