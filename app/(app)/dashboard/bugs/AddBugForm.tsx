"use client";

import { useState } from "react";

type Member = { id: string; name: string };

export function AddBugForm({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const payload = {
      title: (form.querySelector('[name="title"]') as HTMLInputElement).value || undefined,
      severity: Number((form.querySelector('[name="severity"]') as HTMLInputElement).value),
      impactWeight: Number((form.querySelector('[name="impactWeight"]') as HTMLInputElement).value),
      resolvedById: (form.querySelector('[name="resolvedById"]') as HTMLSelectElement).value || undefined,
    };
    const res = await fetch("/api/bugs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add bug");
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
        Add bug fix
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Add bug fix</h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Title (optional)</label>
                <input name="title" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Severity (1–5)</label>
                  <input name="severity" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Impact (1–5)</label>
                  <input name="impactWeight" type="number" min={1} max={5} defaultValue={3} className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Resolved by</label>
                <select name="resolvedById" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white">
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
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
