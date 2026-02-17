"use client";

import { useState } from "react";

export function DeleteButton({
  endpoint,
  confirmMessage = "Delete this item?",
  className = "text-sm text-zinc-400 hover:text-red-400",
}: {
  endpoint: string;
  confirmMessage?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "…" : "Delete"}
    </button>
  );
}
