import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddMeetingForm } from "./AddMeetingForm";
import { EditMeetingButton } from "./EditMeetingButton";
import { DeleteButton } from "../DeleteButton";

export default async function MeetingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const meetings = await prisma.meeting.findMany({
    orderBy: { heldAt: "desc" },
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
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <p className="mt-1 text-zinc-400">
            Importance × contribution level. Capped at 10% of total score.
          </p>
        </div>
        <AddMeetingForm members={members} />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50">
              <th className="px-4 py-3 font-medium text-zinc-300">Topic</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Importance</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Date</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Participants</th>
              <th className="px-4 py-3 font-medium text-zinc-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-4 py-3 font-medium text-white">{m.topic}</td>
                <td className="px-4 py-3 text-zinc-400">{m.importanceWeight}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(m.heldAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {m.contributions.map((c) => (
                    <span key={c.id} className="mr-2">
                      {c.member.name} (L{c.contributionLevel})
                    </span>
                  ))}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-2">
                    <EditMeetingButton meeting={m} members={members} />
                    <span className="text-zinc-600">|</span>
                    <DeleteButton
                      endpoint={`/api/meetings/${m.id}`}
                      confirmMessage={`Delete meeting "${m.topic}"?`}
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
