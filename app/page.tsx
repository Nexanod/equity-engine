import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <h1 className="text-3xl font-bold text-white">
        Dynamic Equity Engine
      </h1>
      <p className="mt-2 max-w-md text-center text-zinc-400">
        Fair, transparent, hard to game. Contribution × Impact × Risk.
      </p>
      <Link
        href="/login"
        className="mt-8 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
      >
        Sign in
      </Link>
    </div>
  );
}
