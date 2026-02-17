"use client";

import { useState } from "react";

type Member = { id: string; name: string };

export function AddFeatureForm({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contributions, setContributions] = useState<{ memberId: string; contributionPercent: number }[]>([]);

  function addContributor() {
    if (members.length === 0) return;
    const firstId = members[0].id;
    if (!contributions.some((c) => c.memberId === firstId)) {
      setContributions([...contributions, { memberId: firstId, contributionPercent: 100 }]);
    } else {
      setContributions([...contributions, { memberId: members[contributions.length % members.length]?.id ?? firstId, contributionPercent: 0 }]);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const payload = {
      title: (form.querySelector('[name="title"]') as HTMLInputElement).value,
      description: (form.querySelector('[name="description"]') as HTMLInputElement).value || undefined,
      impactWeight: Number((form.querySelector('[name="impactWeight"]') as HTMLInputElement).value),
      difficultyWeight: Number((form.querySelector('[name="difficultyWeight"]') as HTMLInputElement).value),
      businessValueWeight: Number((form.querySelector('[name="businessValueWeight"]') as HTMLInputElement).value),
      status: (form.querySelector('[name="status"]') as HTMLSelectElement).value,
      contributions: contributions.filter((c) => c.contributionPercent > 0).length > 0
        ? contributions
        : undefined,
    };
    if (payload.contributions) {
      const sum = payload.contributions.reduce((a, c) => a + c.contributionPercent, 0);
      if (sum !== 100) {
        setError("Contribution % must sum to 100");
        setLoading(false);
        return;
      }
    }
    const res = await fetch("/api/features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create feature");
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
        Add feature
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Add feature</h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Title</label>
                <input name="title" required className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Description</label>
                <input name="description" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Impact (1–10)</label>
                  <input name="impactWeight" type="number" min={1} max={10} defaultValue={5} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Difficulty (1–5)</label>
                  <input name="difficultyWeight" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Business (1–10)</label>
                  <input name="businessValueWeight" type="number" min={1} max={10} defaultValue={5} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Status</label>
                <select name="status" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white">
                  <option value="draft">Draft</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-zinc-400">Contributors (% must sum to 100)</label>
                  <button type="button" onClick={addContributor} className="text-sm text-emerald-400 hover:underline">
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
                      min={0}
                      max={100}
                      value={c.contributionPercent}
                      onChange={(e) => {
                        const next = [...contributions];
                        next[i] = { ...next[i], contributionPercent: Number(e.target.value) };
                        setContributions(next);
                      }}
                      className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
                    />
                    %
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50">
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
