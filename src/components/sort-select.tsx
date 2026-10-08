"use client";

import { useRouter } from "next/navigation";

/** SP の並び替えセレクト。選んだ並び順の URL へ移動する */
export function SortSelect({ options }: { options: { id: string; label: string; href: string; current: boolean }[] }) {
  const router = useRouter();
  const current = options.find((o) => o.current)?.id ?? options[0]?.id;
  return (
    <label className="relative">
      <span className="sr-only">並び替え</span>
      <select
        value={current}
        onChange={(e) => {
          const o = options.find((x) => x.id === e.target.value);
          if (o) router.push(o.href);
        }}
        className="h-9 cursor-pointer appearance-none rounded-lg bg-surface-container-lowest pr-7 pl-3 font-label-sm text-label-sm text-on-surface shadow-sm focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        className="material-symbols-outlined pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[16px] text-on-surface-variant"
        aria-hidden
      >
        arrow_drop_down
      </span>
    </label>
  );
}
