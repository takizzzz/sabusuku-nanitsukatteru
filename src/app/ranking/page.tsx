import type { Metadata } from "next";
import Link from "next/link";
import { Card, categoryIcon, ChipNav, Icon, PageHeader, SectionHead } from "@/components/catalog/ui";
import { ServiceRow } from "@/components/service-row";
import { getIndex } from "@/lib/data";
import { MIN_USERS_FOR_STATS, ranking, type RankingKind } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "サブスクランキング",
  description: "利用者数・満足度・解約数で見るサブスクのランキング。順位は登録データだけで決めています。",
};

export const revalidate = 300;

const KINDS: { id: RankingKind; label: string; icon: string; title: string }[] = [
  { id: "users", label: "利用者数", icon: "group", title: "利用者が多い順" },
  { id: "satisfaction", label: "満足度", icon: "star", title: "満足度が高い順" },
  { id: "cancels", label: "解約数", icon: "cancel", title: "解約が多い順" },
];

/** S-07 ランキング */
export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const sp = await searchParams;
  const current = KINDS.find((k) => k.id === sp.kind) ?? KINDS[0];
  const kind = current.id;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const idx = await getIndex();
  const rows = ranking(idx, kind, { categorySlug: category, limit: 30 });
  const categories = [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const categoryName = categories.find((c) => c.slug === category)?.name;

  const href = (k: RankingKind, c?: string) => {
    const qs = new URLSearchParams();
    if (k !== "users") qs.set("kind", k);
    if (c) qs.set("category", c);
    const s = qs.toString();
    return s ? `/ranking?${s}` : "/ranking";
  };

  return (
    <div className="flex w-full flex-col pb-10">
      <PageHeader
        badge="Subscription Ranking"
        badgeIcon="trophy"
        title="サブスクランキング"
        description="順位は会員の登録データだけで決めています。広告・アフィリエイトの有無は関係ありません。"
      />

      <div className="mx-auto w-full max-w-3xl md:px-margin md:pt-space-lg">
        <div className="flex flex-col gap-2.5 md:gap-space-sm">
          <nav aria-label="ランキングの種類" className="px-margin-mobile md:px-0">
            <div className="flex items-center rounded-lg bg-surface-container p-1">
              {KINDS.map((k) => (
                <Link
                  key={k.id}
                  href={href(k.id, category)}
                  scroll={false}
                  aria-current={kind === k.id ? "page" : undefined}
                  className={`flex min-h-9 flex-1 items-center justify-center gap-1 rounded-md font-label-md text-label-md transition-colors ${
                    kind === k.id
                      ? "bg-surface-container-lowest font-bold text-primary shadow-sm"
                      : "font-medium text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Icon name={k.icon} className={`text-[16px] ${kind === k.id ? "fill" : ""}`} />
                  {k.label}
                </Link>
              ))}
            </div>
          </nav>

          <ChipNav
            label="カテゴリ"
            items={[{ slug: undefined, name: "すべて" }, ...categories].map((c) => ({
              key: c.slug ?? "all",
              href: href(kind, c.slug),
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

        <section className="mt-space-lg px-margin-mobile md:px-0" aria-labelledby="ranking-heading">
          <SectionHead
            id="ranking-heading"
            icon="trophy"
            title={`${categoryName ?? "全カテゴリ"}・${current.title}`}
            note={rows.length > 0 ? <span className="num">{rows.length}件</span> : undefined}
          />
          <Card className="p-space-xs">
            {rows.length > 0 ? (
              <ol className="divide-y divide-surface-container">
                {rows.map((s, i) => (
                  <li key={s.service.id}>
                    <ServiceRow stat={s} rank={i + 1} />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex flex-col items-center gap-2 p-space-lg text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-surface-container">
                  <Icon name="hourglass_empty" className="text-[24px] text-outline" />
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">まだ集計できるデータがありません。</p>
              </div>
            )}
          </Card>
          <p className="mt-space-sm flex items-start gap-1 font-label-sm text-label-sm font-normal text-outline">
            <Icon name="verified" className="text-[14px]" />
            <span>
              順位は広告・アフィリエイトの有無に関係なく、登録データだけで決めています。
              {kind === "satisfaction" && `満足度は利用者が${MIN_USERS_FOR_STATS}人以上のサービスだけを表示しています。`}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}
