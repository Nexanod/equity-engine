"use client";

import { useState } from "react";

export function CreateSnapshotForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!periodLabel.trim()) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodLabel: periodLabel.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create snapshot");
      return;
    }
    setOpen(false);
    setPeriodLabel("");
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Create snapshot
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Quarterly snapshot</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Freeze current equity for this period (e.g. 2025-Q1).
            </p>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Period label</label>
                <input
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  placeholder="2025-Q1"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !periodLabel.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-50">
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
