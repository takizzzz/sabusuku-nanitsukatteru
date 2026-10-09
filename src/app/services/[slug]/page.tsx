import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateLink } from "@/components/affiliate-link";
import { Avatar } from "@/components/avatar";
import { Bar, Card, categoryIcon, Icon, SectionHead } from "@/components/catalog/ui";
import { Price } from "@/components/price";
import { ServiceLogo } from "@/components/service-logo";
import { StackCard } from "@/components/stack-card";
import { Stars } from "@/components/stars";
import { Tag } from "@/components/tag";
import { getIndex } from "@/lib/data";
import { percent, yearMonth, yen } from "@/lib/format";
import { MIN_USERS_FOR_STATS, pairSlug, serviceDetail } from "@/lib/stacks";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = serviceDetail(await getIndex(), slug);
  if (!d) return {};
  const { service } = d.stat;
  return {
    title: `${service.name}の使い分け・満足度・月額`,
    description: `${service.name}を契約している${d.stat.activeUsers}人の使い方、満足度、よく一緒に使われているサービス、解約理由。`,
    alternates: { canonical: `/services/${slug}` },
  };
}

/** S-05 サービス詳細 */
export default async function ServicePage({ params, searchParams }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const satFilter = Number(sp.sat) || null;
  const d = serviceDetail(await getIndex(), slug);
  if (!d) notFound();

  const { stat } = d;
  const { service } = stat;
  const comments = satFilter ? d.comments.filter((c) => c.entry.sub.satisfaction === satFilter) : d.comments;
  const checkedAt = d.plans.map((p) => p.plan.priceCheckedAt).sort().at(-1);
  const enough = stat.activeUsers >= MIN_USERS_FOR_STATS;
  const plan = stat.representativePlan;

  return (
    <div className="mx-auto w-full max-w-2xl pb-10 lg:max-w-5xl lg:px-margin lg:py-space-lg">
      {/* ヘッダー */}
      <section className="px-margin-mobile pt-3 pb-4 lg:px-0 lg:pt-0 lg:pb-space-lg">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-variant p-space-md shadow-sm lg:p-space-lg">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-28 rounded-full bg-primary/10 blur-xl lg:size-64" />
          <div className="pointer-events-none absolute -top-6 -left-6 size-24 rounded-full bg-tertiary/10 blur-xl lg:size-56" />
          <div className="relative flex flex-col gap-space-md lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 lg:gap-space-md">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest shadow-sm lg:size-20">
                <span className="*:size-12! lg:*:size-14!">
                  <ServiceLogo service={service} size="lg" />
                </span>
              </span>
              <div className="min-w-0">
                <Link
                  href={`/ranking?category=${stat.category.slug}`}
                  className="mb-1 inline-flex items-center gap-1 rounded-full bg-surface-container-lowest px-2.5 py-0.5 font-label-sm text-label-sm text-primary shadow-sm hover:underline"
                >
                  <Icon name={categoryIcon(stat.category.slug)} className="text-[14px]" />
                  {stat.category.name}
                </Link>
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface lg:font-headline-lg lg:text-headline-lg">
                  {service.name}
                </h1>
                {service.company && <p className="font-body-sm text-body-sm text-on-surface-variant">{service.company}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              {plan && (
                <p className="flex items-baseline gap-1.5 text-on-surface lg:justify-end">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{plan.name}</span>
                  <Price value={plan.billingCycle === "yearly" ? Math.round(plan.price / 12) : plan.price} size="lg" />
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <AffiliateLink service={service} from={`service:${service.slug}`} className="min-h-11 flex-1 justify-center lg:flex-none" />
                <Link
                  href={`/welcome?service=${service.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-surface-container-lowest px-3 font-headline-sm text-headline-sm whitespace-nowrap text-on-surface lg:px-space-md shadow-sm transition-colors hover:bg-surface-container-low lg:flex-none"
                >
                  <Icon name="add_circle" className="text-[18px] text-primary" />
                  自分も使ってる
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 数字 */}
      <section className="px-margin-mobile lg:mb-space-xl lg:px-0" aria-label="数字">
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-surface-container-low p-3 shadow-sm lg:p-space-md">
          <Num label="利用者" note={`構成の ${percent(stat.usageRate)}`}>
            <span className="text-primary">{yen(stat.activeUsers)}</span>
            <span className="ml-0.5 font-label-sm text-label-sm">人</span>
          </Num>
          <Num label="平均満足度" note={stat.avgSatisfaction !== null ? "★1〜5の平均" : `${MIN_USERS_FOR_STATS}人以上で表示`}>
            {stat.avgSatisfaction !== null ? (
              <span className="inline-flex items-center gap-0.5">
                <Icon name="star" className="fill text-[18px] text-amber-500 lg:text-[22px] dark:text-amber-400" />
                {stat.avgSatisfaction.toFixed(1)}
              </span>
            ) : (
              <span className="font-label-md text-label-md text-on-surface-variant">データ不足</span>
            )}
          </Num>
          <Num label="解約した人" note="登録データ">
            {yen(stat.cancelCount)}
            <span className="ml-0.5 font-label-sm text-label-sm">人</span>
          </Num>
        </dl>
      </section>

      {/* プラン */}
      <Block id="plans" icon="payments" title="プランと月額" note="公式の参考価格">
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low text-left font-label-sm text-label-sm text-on-surface-variant">
              <tr>
                <th className="px-3.5 py-2 font-semibold lg:px-space-md">プラン</th>
                <th className="px-3.5 py-2 text-right font-semibold lg:px-space-md">月額</th>
                <th className="px-3.5 py-2 text-right font-semibold lg:px-space-md">利用者の割合</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {d.plans.map(({ plan: p, ratio }) => (
                <tr key={p.id}>
                  <td className="px-3.5 py-3 font-headline-sm text-headline-sm text-on-surface lg:px-space-md">{p.name}</td>
                  <td className="px-3.5 py-3 text-right text-on-surface lg:px-space-md">
                    {p.billingCycle === "yearly" ? (
                      <>
                        <Price value={Math.round(p.price / 12)} size="sm" />
                        <p className="num font-label-sm text-label-sm text-outline">年額 ¥{yen(p.price)}</p>
                      </>
                    ) : (
                      <Price value={p.price} size="sm" />
                    )}
                  </td>
                  <td className="num px-3.5 py-3 text-right font-price-md text-price-md text-primary lg:px-space-md">{enough ? percent(ratio) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {checkedAt && (
          <p className="mt-2 flex items-start gap-1 font-label-sm text-label-sm font-normal text-outline">
            <Icon name="info" className="text-[14px]" />
            <span>価格は{yearMonth(checkedAt.slice(0, 7))}時点の参考値（税込）です。最新の価格は公式サイトで確認してください。</span>
          </p>
        )}
      </Block>

      <div className="lg:mb-space-xl lg:grid lg:grid-cols-2 lg:gap-gutter">
        {/* 併用 */}
        <Block id="co-usage" icon="join" title="よく一緒に使われている" flush>
          <Card className="h-full p-space-md lg:p-space-lg">
            {d.coUsage === null ? (
              <Shortage />
            ) : d.coUsage.length === 0 ? (
              <Empty>まだありません。</Empty>
            ) : (
              <ul className="space-y-3">
                {d.coUsage.map((c) => (
                  <li key={c.service.id}>
                    <Link href={`/compare/${pairSlug(service, c.service)}`} className="group block">
                      <div className="flex items-center gap-2">
                        <ServiceLogo service={c.service} size="sm" />
                        <span className="min-w-0 flex-1 truncate font-label-md text-label-md text-on-surface group-hover:text-primary">{c.service.name}</span>
                        <span className="num font-price-md text-price-md text-primary">{percent(c.ratio)}</span>
                        <Icon name="chevron_right" className="text-[16px] text-outline" />
                      </div>
                      <Bar ratio={c.ratio} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Block>

        {/* 用途 */}
        <Block id="usage" icon="sell" title="何に使っている？" flush>
          <Card className="h-full p-space-md lg:p-space-lg">
            {!enough ? (
              <Shortage />
            ) : d.tagShares.length === 0 ? (
              <Empty>まだ用途タグがありません。</Empty>
            ) : (
              <ul className="space-y-3">
                {d.tagShares.map((t) => (
                  <li key={t.tag}>
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface">
                        <span className="font-bold text-primary">#</span> {t.tag}
                      </span>
                      <span className="num font-price-md text-price-md text-primary">{percent(t.ratio)}</span>
                    </div>
                    <Bar ratio={t.ratio} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Block>
      </div>

      {/* 使い方 */}
      <Block id="comments" icon="forum" title="みんなの使い方" count={`${d.comments.length}件`}>
        <nav aria-label="満足度で絞り込み" className="no-scrollbar -mx-margin-mobile mb-space-sm flex gap-1.5 overflow-x-auto px-margin-mobile py-0.5 lg:mx-0 lg:px-0">
          {[null, 5, 4, 3, 2, 1].map((s) => (
            <Link
              key={s ?? "all"}
              href={s ? `/services/${service.slug}?sat=${s}` : `/services/${service.slug}`}
              scroll={false}
              aria-current={satFilter === s ? "page" : undefined}
              className={`flex h-8 shrink-0 items-center gap-0.5 rounded-full px-3 font-label-md text-label-md whitespace-nowrap shadow-sm transition-colors ${
                satFilter === s ? "bg-primary-container font-bold text-white" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {s ? (
                <>
                  <Icon name="star" className={`fill text-[14px] ${satFilter === s ? "" : "text-amber-500 dark:text-amber-400"}`} />
                  <span className="num">{s}</span>
                  <span className="sr-only">の満足度</span>
                </>
              ) : (
                "すべて"
              )}
            </Link>
          ))}
        </nav>
        {comments.length === 0 ? (
          <Card className="p-space-md">
            <Empty>該当する使い方はまだありません。</Empty>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 lg:gap-gutter">
            {comments.map(({ entry, profile }) => (
              <article key={entry.sub.id} className="flex flex-col rounded-xl bg-surface-container-lowest p-space-md shadow-sm lg:p-space-lg">
                <div className="mb-2 flex items-center gap-2.5">
                  <Avatar profile={profile} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/@${profile.handle}`} className="block truncate font-headline-sm text-headline-sm text-on-surface hover:text-primary">
                      @{profile.handle}
                    </Link>
                    <p className="truncate font-label-sm text-label-sm font-normal text-on-surface-variant">
                      {[profile.occupation, profile.ageRange].filter(Boolean).join("・")}
                    </p>
                  </div>
                  {entry.sub.satisfaction && <Stars value={entry.sub.satisfaction} size="sm" className="shrink-0" />}
                </div>
                <p className="rounded-lg bg-surface-container-low p-3 font-body-md text-body-md leading-relaxed text-on-surface">{entry.sub.comment}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {entry.plan && (
                    <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">{entry.plan.name}プラン</span>
                  )}
                  {entry.sub.tags.map((t) => (
                    <Tag key={t} name={t} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Block>

      {/* 解約理由 */}
      <Block id="cancels" icon="cancel" title="解約した理由" count={`${stat.cancelCount}件`} muted>
        {stat.cancelCount === 0 ? (
          <Card className="p-space-md">
            <Empty>まだ解約の記録はありません。</Empty>
          </Card>
        ) : (
          <Card className="grid gap-space-md p-space-md lg:grid-cols-2 lg:gap-space-lg lg:p-space-lg">
            <ul className="space-y-3">
              {d.cancelReasons.map((r) => (
                <li key={r.reason}>
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface">{r.reason}</span>
                    <span className="num font-label-md text-label-md font-bold text-on-surface-variant">{r.count}件</span>
                  </div>
                  <Bar ratio={r.count / stat.cancelCount} tone="muted" />
                </li>
              ))}
            </ul>
            <div className="space-y-space-sm">
              {d.switchedTo.length > 0 && (
                <div>
                  <p className="mb-1.5 font-label-sm text-label-sm text-on-surface-variant">乗り換え先</p>
                  <ul className="space-y-1.5">
                    {d.switchedTo.map((s) => (
                      <li key={s.service.id}>
                        <Link
                          href={`/services/${s.service.slug}`}
                          className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container"
                        >
                          <span className="truncate text-on-surface-variant">{service.name}</span>
                          <Icon name="arrow_forward" className="text-[14px] text-outline" />
                          <span className="sr-only">から</span>
                          <ServiceLogo service={s.service} size="xs" />
                          <span className="truncate font-bold text-primary">{s.service.name}</span>
                          <span className="num ml-auto shrink-0 text-on-surface-variant">{s.count}人</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.cancelComments.length > 0 && (
                <ul className="space-y-2">
                  {d.cancelComments.map(({ entry, profile }) => (
                    <li key={entry.sub.id} className="rounded-lg bg-surface-container-low px-3 py-2.5">
                      <p className="flex items-start gap-1 font-body-sm text-body-sm text-on-surface">
                        <Icon name="format_quote" className="text-[14px] text-outline" />
                        <span>{entry.sub.cancelReasonDetail}</span>
                      </p>
                      <p className="mt-1 font-label-sm text-label-sm font-normal text-outline">
                        @{profile.handle}・{yearMonth(entry.sub.cancelledOn)}に解約
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}
      </Block>

      {d.stacks.length > 0 && (
        <Block
          id="stacks"
          icon="group"
          title={`${service.name}を使っている人の構成`}
          note={
            <Link href={`/stacks?services=${service.slug}`} className="inline-flex items-center gap-0.5 font-bold text-primary hover:underline">
              すべて見る
              <Icon name="chevron_right" className="text-[16px]" />
            </Link>
          }
        >
          <div className="grid gap-3 lg:grid-cols-3 lg:gap-gutter">
            {d.stacks.map((s) => (
              <StackCard key={s.profile.id} stack={s} />
            ))}
          </div>
        </Block>
      )}

      {/* CTA */}
      <section className="mt-space-lg px-margin-mobile lg:mt-0 lg:px-0">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container p-space-md text-on-primary shadow-md lg:p-space-lg dark:from-primary-container dark:to-tertiary-container dark:text-on-primary-container">
          <Icon name="add_circle" className="pointer-events-none absolute -right-4 -bottom-6 text-[110px] opacity-10 select-none lg:text-[160px]" />
          <div className="relative z-10 lg:flex lg:items-end lg:justify-between lg:gap-space-lg">
            <div>
              <h2 className="font-headline-md text-headline-md leading-tight font-bold">{service.name}を使っていますか？</h2>
              <p className="mt-1.5 font-body-sm text-body-sm leading-relaxed opacity-90">あなたの使い方を登録すると、検討中の人の参考になります。</p>
            </div>
            <div className="mt-space-md lg:mt-0 lg:shrink-0">
              <Link
                href={`/welcome?service=${service.slug}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-3 font-headline-sm text-headline-sm font-bold text-primary shadow transition-all hover:bg-surface-container-low active:scale-[0.98] lg:w-auto lg:px-space-lg"
              >
                <span>自分の構成を登録する</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** セクション（見出し＋中身）。flush は2カラムの中で使うとき（下の余白を親に任せる） */
function Block({
  id,
  icon,
  title,
  count,
  note,
  muted,
  flush,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  count?: string;
  note?: ReactNode;
  muted?: boolean;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`mt-space-lg flex flex-col px-margin-mobile lg:px-0 ${flush ? "lg:mt-0" : "lg:mt-0 lg:mb-space-xl"}`}
      aria-labelledby={`${id}-heading`}
    >
      <SectionHead id={`${id}-heading`} icon={icon} title={title} count={count} note={note} muted={muted} />
      <div className="flex-1">{children}</div>
    </section>
  );
}

function Num({ label, note, children }: { label: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <dt className="font-label-sm text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="num mt-0.5 font-price-md text-price-md font-bold text-on-surface lg:font-price-lg lg:text-price-lg">{children}</dd>
      <dd className="font-body-sm text-[10px] text-on-surface-variant lg:text-body-sm">{note}</dd>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="font-body-sm text-body-sm text-on-surface-variant">{children}</p>;
}

function Shortage() {
  return (
    <p className="flex items-start gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
      <Icon name="lock" className="text-[16px] text-outline" />
      <span>利用者が{MIN_USERS_FOR_STATS}人以上になったら表示します（個人が特定されないようにするため）。</span>
    </p>
  );
}
