"use client";

import { useState } from "react";

type Member = { id: string; name: string };

export function AddMeetingForm({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributions, setContributions] = useState<{ memberId: string; contributionLevel: number }[]>(
    members.length > 0 ? [{ memberId: members[0].id, contributionLevel: 3 }] : []
  );

  function addParticipant() {
    const nextId = members[contributions.length % members.length]?.id ?? members[0]?.id;
    if (nextId) setContributions([...contributions, { memberId: nextId, contributionLevel: 3 }]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const payload = {
      topic: (form.querySelector('[name="topic"]') as HTMLInputElement).value,
      importanceWeight: Number((form.querySelector('[name="importanceWeight"]') as HTMLInputElement).value),
      contributions,
    };
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add meeting");
      return;
    }
    setOpen(false);
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Add meeting
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Add meeting</h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Topic</label>
                <input name="topic" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Importance (1–5)</label>
                <input name="importanceWeight" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-zinc-400">Participants (contribution level 1–5)</label>
                  <button type="button" onClick={addParticipant} className="text-sm text-emerald-400 hover:underline">
                    + Add
                  </button>
                </div>
                {contributions.map((c, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <select
                      value={c.memberId}
                      onChange={(e) => {
                        const next = [...contributions];
                        next[i] = { ...next[i], memberId: e.target.value };
                        setContributions(next);
                      }}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={c.contributionLevel}
                      onChange={(e) => {
                        const next = [...contributions];
                        next[i] = { ...next[i], contributionLevel: Number(e.target.value) };
                        setContributions(next);
                      }}
                      className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
                    />
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50">
                  {loading ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
