import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Equity
            </Link>
            <Link
              href="/dashboard/features"
              className="text-zinc-400 hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/dashboard/bugs"
              className="text-zinc-400 hover:text-white"
            >
              Bugs
            </Link>
            <Link
              href="/dashboard/meetings"
              className="text-zinc-400 hover:text-white"
            >
              Meetings
            </Link>
            <Link
              href="/dashboard/decisions"
              className="text-zinc-400 hover:text-white"
            >
              Decisions
            </Link>
            <Link
              href="/dashboard/reports"
              className="text-zinc-400 hover:text-white"
            >
              Reports
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              {(session.user as { role?: string }).role ?? "Viewer"}
            </span>
            <Link
              href="/api/auth/signout?callbackUrl=/"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
