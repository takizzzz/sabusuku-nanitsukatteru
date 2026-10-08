"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Search } from "lucide-react";
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
}: {
  catalog: Catalog;
  selected: string[];
  onToggle: (s: CatalogService) => void;
  multiple?: boolean;
  exclude?: string[];
  limit?: number;
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
    <div className="space-y-3">
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 focus-within:border-accent">
        <Search className="size-4 text-subtle" aria-hidden />
        <span className="sr-only">サービスを検索</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="サービス名で検索（例：ChatGPT）"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle md:text-sm"
        />
      </label>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {[{ id: null, name: "すべて" }, ...catalog.categories].map((c) => (
          <button
            key={c.id ?? "all"}
            type="button"
            onClick={() => setCat(c.id)}
            aria-pressed={cat === c.id}
            className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold ${cat === c.id ? "bg-fg text-bg" : "bg-surface-3 text-muted"}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      {hits.length === 0 ? (
        <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">
          「{q}」は見つかりませんでした。
          <Link href={`/services/request?name=${encodeURIComponent(q)}`} className="ml-1 font-bold text-accent-strong underline">
            サービスの追加を申請する
          </Link>
        </p>
      ) : (
        <ul className={`grid gap-2 ${multiple ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-2"}`}>
          {hits.slice(0, limit).map((s) => {
            const on = selected.includes(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(s)}
                  className={`relative flex w-full items-center gap-2 rounded-xl border p-2 text-left hover:border-accent ${multiple ? "min-h-24 flex-col justify-center text-center" : "min-h-12"} ${on ? "border-accent bg-accent-soft" : "border-line bg-card"}`}
                >
                  <ServiceLogo service={s} size={multiple ? "lg" : "sm"} />
                  <span className="min-w-0 text-xs leading-tight font-bold">{s.name}</span>
                  {on && (
                    <Check className={`size-4 text-accent-strong ${multiple ? "absolute top-1.5 right-1.5" : "ml-auto"}`} aria-label="選択中" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {hits.length > limit && <p className="text-xs text-subtle">ほか{hits.length - limit}件。名前で絞り込めます。</p>}
      <p className="text-xs text-subtle">
        見つからないサービスは
        <Link href="/services/request" className="mx-1 font-bold text-accent-strong underline">
          追加を申請
        </Link>
        できます。
      </p>
    </div>
  );
}
