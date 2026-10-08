"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ServiceLogo } from "@/components/service-logo";
import { normalize, type Catalog, type CatalogService } from "@/lib/catalog";

/** サービスのインクリメンタル検索（F-05）。複数選択と単一選択の両方で使う */
export function ServicePicker({
  catalog,
  selected,
  onToggle,
  multiple,
  exclude = [],
  limit = 24,
  inputId,
}: {
  catalog: Catalog;
  selected: string[];
  onToggle: (s: CatalogService) => void;
  multiple?: boolean;
  exclude?: string[];
  limit?: number;
  inputId?: string;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | null>(null);
  const hits = useMemo(() => {
    const nq = normalize(q);
    return catalog.services.filter(
      (s) =>
        !exclude.includes(s.id) &&
        (cat === null || s.categoryId === cat) &&
        (!nq || normalize(s.name).includes(nq) || normalize(s.company ?? "").includes(nq) || normalize(s.slug).includes(nq)),
    );
  }, [catalog.services, q, cat, exclude]);

  return (
    <div className="flex flex-col gap-space-sm">
      <label className="relative block">
        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-outline" aria-hidden>
          search
        </span>
        <span className="sr-only">サービスを検索</span>
        <input
          id={inputId}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例：ChatGPT, Netflix, Notion…"
          className="h-11 w-full rounded-xl bg-surface-container-low pr-24 pl-10 font-body-md text-base text-on-surface transition-all outline-none placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 md:text-body-md"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
          {hits.length}件
        </span>
      </label>
      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
        {[{ id: null, name: "すべて" }, ...catalog.categories].map((c) => (
          <button
            key={c.id ?? "all"}
            type="button"
            onClick={() => setCat(c.id)}
            aria-pressed={cat === c.id}
            className={`min-h-8 shrink-0 rounded-full px-3 font-label-md text-label-md transition-colors ${cat === c.id ? "bg-on-surface font-bold text-surface-container-lowest" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {hits.length === 0 ? (
        <p className="rounded-xl bg-surface-container-low p-space-md font-body-md text-body-md text-on-surface-variant">
          「{q}」は見つかりませんでした。
          <Link href={`/services/request?name=${encodeURIComponent(q)}`} className="ml-1 font-bold text-primary hover:underline">
            サービスの追加を申請する
          </Link>
        </p>
      ) : (
        <ul className={`grid gap-space-sm ${multiple ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-2"}`}>
          {hits.slice(0, limit).map((s) => {
            const on = selected.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(s)}
                  className={`relative flex w-full items-center gap-2 rounded-xl p-2 text-left transition-all ${multiple ? "min-h-24 flex-col justify-center text-center" : "min-h-12"} ${on ? "bg-primary-fixed/50 shadow-sm ring-2 ring-primary-container" : "bg-surface-container-low hover:bg-surface-container"}`}
                >
                  <ServiceLogo service={s} size={multiple ? "lg" : "sm"} />
                  <span className="min-w-0 font-label-md text-label-md leading-tight font-bold text-on-surface">{s.name}</span>
                  {on && (
                    <span
                      className={`material-symbols-outlined fill text-[20px] text-primary ${multiple ? "absolute top-1 right-1" : "ml-auto"}`}
                      aria-label="選択中"
                    >
                      check_circle
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hits.length > limit && <p className="font-body-sm text-body-sm text-on-surface-variant">ほか{hits.length - limit}件。名前で絞り込めます。</p>}
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        見つからないサービスは
        <Link href="/services/request" className="mx-1 inline-flex items-center gap-0.5 font-bold text-primary hover:underline">
          追加を申請
          <span className="material-symbols-outlined text-[13px]" aria-hidden>
            open_in_new
          </span>
        </Link>
        できます。
      </p>
    </div>
  );
}
