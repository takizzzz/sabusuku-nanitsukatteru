import type { Metadata } from "next";
import Link from "next/link";
import { Card, categoryIcon, ChipNav, CountPill, Icon, PageHeader, SectionHead } from "@/components/catalog/ui";
import { ServiceRow } from "@/components/service-row";
import { getIndex } from "@/lib/data";
import { yen } from "@/lib/format";
import { serviceStats } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "サービス一覧",
  description: "生成AI・動画・音楽・仕事ツールなど、登録されているサブスクの一覧。利用者数と満足度つき。",
};

/** S-04 サービス一覧 */
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

  // 絞り込みが無いときは、カテゴリごとに上位だけ見せる
  const perGroup = category || q ? Infinity : 8;
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

  const count = (
    <>
      <span className="num">{yen(stats.length)}</span>件
    </>
  );

  return (
    <div className="flex w-full flex-col pb-10">
      <PageHeader
        badge="Service Catalog"
        badgeIcon="apps"
        title="サービス一覧"
        description="登録されているサブスクを、利用者数・満足度・代表的なプランの月額つきで一覧できます。"
        aside={<CountPill>{count}</CountPill>}
      />

      <div className="mx-auto w-full max-w-5xl md:px-margin md:pt-space-lg">
        <div className="flex flex-col gap-2.5 md:gap-space-sm">
          <form action="/services" role="search" className="px-margin-mobile md:px-0">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="relative flex w-full items-center rounded-xl bg-surface-container-lowest shadow-sm">
              <Icon name="search" className="pointer-events-none absolute left-3.5 text-[20px] text-on-surface-variant" />
              <label htmlFor="services-q" className="sr-only">
                サービスを検索
              </label>
              <input
                id="services-q"
                name="q"
                defaultValue={q}
                placeholder="サービス名・会社名・カテゴリで検索..."
                className="h-11 w-full rounded-xl bg-transparent pr-24 pl-10 font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-outline focus:bg-surface-container-low focus:outline-none md:h-12 md:font-body-md md:text-body-md"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {q && (
                  <Link
                    href={href(category)}
                    aria-label="キーワードを消す"
                    className="flex size-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    <Icon name="close" className="text-[16px]" />
                  </Link>
                )}
                <button
                  type="submit"
                  className="flex h-8 items-center rounded-lg bg-primary-container px-3 font-label-sm text-label-sm text-white shadow-sm transition-transform active:scale-95"
                >
                  検索
                </button>
              </div>
            </div>
          </form>

          <ChipNav
            label="カテゴリ"
            items={[{ slug: undefined, name: "すべて" }, ...categories].map((c) => ({
              key: c.slug ?? "all",
              href: href(c.slug),
              current: category === c.slug,
              label: (
                <>
                  {c.slug && <Icon name={categoryIcon(c.slug)} className="text-[16px]" />}
                  <span>{c.name}</span>
                </>
              ),
            }))}
          />
        </div>

        {groups.length === 0 ? (
          <div className="mx-margin-mobile mt-space-lg flex flex-col items-center gap-2 rounded-xl bg-surface-container-lowest p-space-lg text-center shadow-sm md:mx-0">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-container">
              <Icon name="search_off" className="text-[24px] text-outline" />
            </span>
            <p className="font-headline-sm text-headline-sm text-on-surface">見つかりませんでした</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">登録されていないサービスは、ログイン後に追加を申請できます。</p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.category.id} className="mt-space-lg px-margin-mobile md:px-0" aria-labelledby={`cat-${g.category.slug}`}>
              <SectionHead
                id={`cat-${g.category.slug}`}
                icon={categoryIcon(g.category.slug)}
                title={g.category.name}
                count={g.items.length}
                note={
                  <Link href={`/ranking?category=${g.category.slug}`} className="inline-flex items-center gap-0.5 font-bold text-primary hover:underline">
                    ランキング
                    <Icon name="chevron_right" className="text-[16px]" />
                  </Link>
                }
              />
              <Card className="divide-y divide-surface-container p-space-xs">
                {g.items.slice(0, perGroup).map((s) => (
                  <ServiceRow key={s.service.id} stat={s} />
                ))}
              </Card>
              {g.items.length > perGroup && (
                <Link
                  href={href(g.category.slug)}
                  className="mt-space-xs flex items-center justify-center gap-0.5 rounded-xl py-2.5 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-surface-container-low"
                >
                  {g.category.name}をすべて見る（<span className="num">{g.items.length}</span>件）
                  <Icon name="chevron_right" className="text-[16px]" />
                </Link>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
