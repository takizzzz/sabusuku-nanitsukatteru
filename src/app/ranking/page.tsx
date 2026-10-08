import type { Metadata } from "next";
import Link from "next/link";
import { ServiceRow } from "@/components/service-row";
import { getIndex } from "@/lib/data";
import { MIN_USERS_FOR_STATS, ranking, type RankingKind } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "サブスクランキング",
  description: "利用者数・満足度・解約数で見るサブスクのランキング。順位は登録データだけで決めています。",
};

export const revalidate = 300;

const KINDS: { id: RankingKind; label: string }[] = [
  { id: "users", label: "利用者数" },
  { id: "satisfaction", label: "満足度" },
  { id: "cancels", label: "解約数" },
];

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const sp = await searchParams;
  const kind = (KINDS.find((k) => k.id === sp.kind)?.id ?? "users") as RankingKind;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const idx = await getIndex();
  const rows = ranking(idx, kind, { categorySlug: category, limit: 30 });
  const categories = [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const href = (k: RankingKind, c?: string) => {
    const qs = new URLSearchParams();
    if (k !== "users") qs.set("kind", k);
    if (c) qs.set("category", c);
    const s = qs.toString();
    return s ? `/ranking?${s}` : "/ranking";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">サブスクランキング</h1>
      <p className="mt-1 text-sm text-muted">順位は会員の登録データだけで決めています。広告・アフィリエイトの有無は関係ありません。</p>

      <nav aria-label="ランキングの種類" className="mt-6 flex rounded-lg bg-surface-2 p-1">
        {KINDS.map((k) => (
          <Link
            key={k.id}
            href={href(k.id, category)}
            aria-current={kind === k.id ? "page" : undefined}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-md text-sm font-bold ${kind === k.id ? "bg-card shadow-sm" : "text-subtle"}`}
          >
            {k.label}
          </Link>
        ))}
      </nav>

      <nav aria-label="カテゴリ" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {[{ slug: undefined, name: "すべて" }, ...categories].map((c) => (
          <Link
            key={c.slug ?? "all"}
            href={href(kind, c.slug)}
            aria-current={category === c.slug ? "page" : undefined}
            className={`flex min-h-10 items-center rounded-full border px-4 text-sm font-bold whitespace-nowrap ${category === c.slug ? "border-accent bg-accent text-on-accent" : "border-line bg-card"}`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl border border-line bg-card p-2">
        {rows.length > 0 ? (
          rows.map((s, i) => <ServiceRow key={s.service.id} stat={s} rank={i + 1} />)
        ) : (
          <p className="p-6 text-center text-sm text-muted">まだ集計できるデータがありません。</p>
        )}
      </div>
      {kind === "satisfaction" && (
        <p className="mt-2 text-xs text-subtle">満足度は利用者が{MIN_USERS_FOR_STATS}人以上のサービスだけを表示しています。</p>
      )}
    </div>
  );
}
