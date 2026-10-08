import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { ServiceRow } from "@/components/service-row";
import { getIndex } from "@/lib/data";
import { serviceStats } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "サービス一覧",
  description: "生成AI・動画・音楽・仕事ツールなど、登録されているサブスクの一覧。利用者数と満足度つき。",
};

export default async function ServicesPage({ searchParams }: PageProps<"/services">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const idx = await getIndex();
  const categories = [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const needle = q.toLowerCase();
  const stats = serviceStats(idx)
    .filter((s) => !category || s.category.slug === category)
    .filter(
      (s) =>
        !needle ||
        s.service.name.toLowerCase().includes(needle) ||
        (s.service.company ?? "").toLowerCase().includes(needle) ||
        s.category.name.includes(q),
    )
    .sort((a, b) => b.activeUsers - a.activeUsers || a.service.name.localeCompare(b.service.name, "ja"));

  const groups = categories
    .map((c) => ({ category: c, items: stats.filter((s) => s.category.id === c.id) }))
    .filter((g) => g.items.length > 0);

  const href = (c?: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (c) qs.set("category", c);
    const s = qs.toString();
    return s ? `/services?${s}` : "/services";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold md:text-3xl">サービス一覧</h1>

      <form action="/services" role="search" className="mt-4">
        {category && <input type="hidden" name="category" value={category} />}
        <label className="flex items-center gap-2 rounded-xl border border-line bg-card px-4">
          <Search className="size-4 text-subtle" aria-hidden />
          <span className="sr-only">サービスを検索</span>
          <input name="q" defaultValue={q} placeholder="サービス名・会社名・カテゴリ" className="min-h-12 w-full bg-transparent outline-none placeholder:text-subtle" />
        </label>
      </form>

      <nav aria-label="カテゴリ" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {[{ slug: undefined, name: "すべて" }, ...categories].map((c) => (
          <Link
            key={c.slug ?? "all"}
            href={href(c.slug)}
            aria-current={category === c.slug ? "page" : undefined}
            className={`flex min-h-10 items-center rounded-full border px-4 text-sm font-bold whitespace-nowrap ${category === c.slug ? "border-accent bg-accent text-on-accent" : "border-line bg-card"}`}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
          <p className="font-bold">見つかりませんでした</p>
          <p className="mt-2 text-sm text-muted">登録されていないサービスは、ログイン後に追加を申請できます。</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.category.id} className="mt-8">
            <h2 className="mb-2 text-lg font-extrabold">{g.category.name}</h2>
            <div className="rounded-2xl border border-line bg-card p-2">
              {g.items.map((s) => (
                <ServiceRow key={s.service.id} stat={s} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
