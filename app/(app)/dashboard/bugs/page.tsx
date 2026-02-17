import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddBugForm } from "./AddBugForm";
import { EditBugButton } from "./EditBugButton";
import { DeleteButton } from "../DeleteButton";

export default async function BugsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const bugs = await prisma.bugFix.findMany({
    orderBy: { resolvedAt: "desc" },
    include: { member: { select: { id: true, name: true } } },
  });
  const members = await prisma.member.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bug fixes</h1>
          <p className="mt-1 text-zinc-400">
            Score = severity × impact × 2. Track who resolved.
          </p>
        </div>
        <AddBugForm members={members} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50">
              <th className="px-4 py-3 font-medium text-zinc-300">Title</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Severity</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Impact</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Resolved by</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Date</th>
              <th className="px-4 py-3 font-medium text-zinc-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bugs.map((b) => (
              <tr key={b.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3 text-white">{b.title ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-400">{b.severity}</td>
                <td className="px-4 py-3 text-zinc-400">{b.impactWeight}</td>
                <td className="px-4 py-3 text-zinc-400">{b.member.name}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(b.resolvedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-2">
                    <EditBugButton bug={b} members={members} />
                    <span className="text-zinc-600">|</span>
                    <DeleteButton
                      endpoint={`/api/bugs/${b.id}`}
                      confirmMessage={`Delete this bug fix?`}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
