import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddFeatureForm } from "./AddFeatureForm";
import { EditFeatureButton } from "./EditFeatureButton";
import { DeleteButton } from "../DeleteButton";

export default async function FeaturesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const features = await prisma.feature.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      contributions: { include: { member: { select: { id: true, name: true } } } },
    },
  });
  const members = await prisma.member.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Features</h1>
          <p className="mt-1 text-zinc-400">
            Define impact, difficulty, business value. Assign contribution %.
          </p>
        </div>
        <AddFeatureForm members={members} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50">
              <th className="px-4 py-3 font-medium text-zinc-300">Title</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Weights</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Contributors</th>
              <th className="px-4 py-3 font-medium text-zinc-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3">
                  <span className="font-medium text-white">{f.title}</span>
                  {f.description && (
                    <p className="mt-0.5 text-xs text-zinc-500">{f.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  I{f.impactWeight} D{f.difficultyWeight} B{f.businessValueWeight}
                  {f.weightsLocked && (
                    <span className="ml-2 text-amber-400">(locked)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      f.status === "done"
                        ? "text-emerald-400"
                        : f.status === "in_progress"
                          ? "text-amber-400"
                          : "text-zinc-500"
                    }
                  >
                    {f.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {f.contributions.map((c) => (
                    <span key={c.id} className="mr-2">
                      {c.member.name} {c.contributionPercent}%
                    </span>
                  ))}
                  {f.contributions.length === 0 && "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-2">
                    <EditFeatureButton feature={f} members={members} />
                    <span className="text-zinc-600">|</span>
                    <DeleteButton
                      endpoint={`/api/features/${f.id}`}
                      confirmMessage={`Delete "${f.title}"? This cannot be undone.`}
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
