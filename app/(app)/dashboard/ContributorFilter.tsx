"use client";

import { useRouter, usePathname } from "next/navigation";

type Member = { id: string; name: string };

export function ContributorFilter({
  members,
  paramName,
  value,
  placeholder = "All contributors",
}: {
  members: Member[];
  paramName: string;
  value: string | null;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    const params = new URLSearchParams();
    if (v) params.set(paramName, v);
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      <option value="">{placeholder}</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
