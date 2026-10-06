import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CirclePlus } from "lucide-react";
import { AffiliateLink } from "@/components/affiliate-link";
import { Avatar } from "@/components/avatar";
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* ヘッダー */}
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 md:flex-row md:items-center">
        <ServiceLogo service={service} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold md:text-3xl">{service.name}</h1>
          <p className="mt-1 text-sm text-subtle">
            {service.company}・
            <Link href={`/ranking?category=${stat.category.slug}`} className="hover:underline">
              {stat.category.name}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AffiliateLink service={service} from={`service:${service.slug}`} />
          <Link
            href={`/welcome?service=${service.slug}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-bold hover:border-accent"
          >
            <CirclePlus className="size-4" aria-hidden />
            自分も使ってる
          </Link>
        </div>
      </section>

      {/* 数字 */}
      <dl className="grid grid-cols-3 gap-3">
        <Num label="利用者">
          <span className="num text-3xl font-extrabold">{yen(stat.activeUsers)}</span>
          <span className="ml-1 text-sm font-bold">人</span>
          <p className="text-xs text-subtle">構成の {percent(stat.usageRate)}</p>
        </Num>
        <Num label="平均満足度">
          {stat.avgSatisfaction !== null ? (
            <span className="num text-3xl font-extrabold">{stat.avgSatisfaction.toFixed(1)}</span>
          ) : (
            <span className="text-sm font-bold text-subtle">データ不足</span>
          )}
        </Num>
        <Num label="解約した人">
          <span className="num text-3xl font-extrabold">{yen(stat.cancelCount)}</span>
          <span className="ml-1 text-sm font-bold">人</span>
        </Num>
      </dl>

      {/* プラン */}
      <Block title="プランと月額">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-subtle">
            <tr>
              <th className="py-2 font-semibold">プラン</th>
              <th className="py-2 text-right font-semibold">月額</th>
              <th className="py-2 pl-4 text-right font-semibold">利用者の割合</th>
            </tr>
          </thead>
          <tbody>
            {d.plans.map(({ plan, ratio }) => (
              <tr key={plan.id} className="border-t border-line">
                <td className="py-3 font-bold">{plan.name}</td>
                <td className="py-3 text-right">
                  {plan.billingCycle === "yearly" ? (
                    <>
                      <Price value={Math.round(plan.price / 12)} size="sm" />
                      <p className="text-[11px] text-subtle">年額 ¥{yen(plan.price)}</p>
                    </>
                  ) : (
                    <Price value={plan.price} size="sm" />
                  )}
                </td>
                <td className="num py-3 pl-4 text-right">{enough ? percent(ratio) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {checkedAt && (
          <p className="mt-2 text-xs text-subtle">
            価格は{yearMonth(checkedAt.slice(0, 7))}時点の参考値（税込）です。最新の価格は公式サイトで確認してください。
          </p>
        )}
      </Block>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 併用 */}
        <Block title="よく一緒に使われているサービス">
          {d.coUsage === null ? (
            <Shortage />
          ) : d.coUsage.length === 0 ? (
            <p className="text-sm text-muted">まだありません。</p>
          ) : (
            <ul className="space-y-3">
              {d.coUsage.map((c) => (
                <li key={c.service.id}>
                  <Link href={`/compare/${pairSlug(service, c.service)}`} className="block hover:opacity-80">
                    <div className="flex items-center gap-2 text-sm">
                      <ServiceLogo service={c.service} size="sm" />
                      <span className="flex-1 font-bold">{c.service.name}</span>
                      <span className="num font-bold">{percent(c.ratio)}</span>
                    </div>
                    <Bar ratio={c.ratio} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Block>

        {/* 用途 */}
        <Block title="何に使っている？">
          {!enough ? (
            <Shortage />
          ) : (
            <ul className="space-y-3">
              {d.tagShares.map((t) => (
                <li key={t.tag}>
                  <div className="flex items-center text-sm">
                    <span className="flex-1 font-bold">#{t.tag}</span>
                    <span className="num font-bold">{percent(t.ratio)}</span>
                  </div>
                  <Bar ratio={t.ratio} />
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>

      {/* 使い方 */}
      <Block title={`みんなの使い方 ${d.comments.length}件`}>
        <nav aria-label="満足度で絞り込み" className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          {[null, 5, 4, 3, 2, 1].map((s) => (
            <Link
              key={s ?? "all"}
              href={s ? `/services/${service.slug}?sat=${s}` : `/services/${service.slug}`}
              scroll={false}
              aria-current={satFilter === s ? "page" : undefined}
              className={`flex min-h-9 items-center rounded-full border px-3 text-xs font-bold whitespace-nowrap ${satFilter === s ? "border-accent bg-accent text-on-accent" : "border-line"}`}
            >
              {s ? `★${s}` : "すべて"}
            </Link>
          ))}
        </nav>
        {comments.length === 0 ? (
          <p className="text-sm text-muted">該当する使い方はまだありません。</p>
        ) : (
          <ul className="divide-y divide-line">
            {comments.map(({ entry, profile }) => (
              <li key={entry.sub.id} className="py-4">
                <div className="flex items-center gap-2">
                  <Avatar profile={profile} size="sm" />
                  <Link href={`/@${profile.handle}`} className="text-sm font-bold hover:underline">
                    @{profile.handle}
                  </Link>
                  <span className="text-xs text-subtle">{[profile.occupation, profile.ageRange].filter(Boolean).join("・")}</span>
                  {entry.sub.satisfaction && (
                    <span className="ml-auto">
                      <Stars value={entry.sub.satisfaction} />
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm">{entry.sub.comment}</p>
                <p className="mt-1 flex flex-wrap gap-x-2">
                  {entry.plan && <span className="text-xs text-subtle">{entry.plan.name}プラン</span>}
                  {entry.sub.tags.map((t) => (
                    <Tag key={t} name={t} />
                  ))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* 解約理由 */}
      <Block title={`解約した理由 ${stat.cancelCount}件`}>
        {stat.cancelCount === 0 ? (
          <p className="text-sm text-muted">まだ解約の記録はありません。</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <ul className="space-y-3">
              {d.cancelReasons.map((r) => (
                <li key={r.reason}>
                  <div className="flex text-sm">
                    <span className="flex-1 font-bold">{r.reason}</span>
                    <span className="num font-bold">{r.count}件</span>
                  </div>
                  <Bar ratio={r.count / stat.cancelCount} tone="muted" />
                </li>
              ))}
            </ul>
            <div>
              {d.switchedTo.length > 0 && (
                <>
                  <p className="mb-2 text-xs font-bold text-subtle">乗り換え先</p>
                  <ul className="space-y-2">
                    {d.switchedTo.map((s) => (
                      <li key={s.service.id}>
                        <Link href={`/services/${s.service.slug}`} className="flex items-center gap-2 text-sm hover:underline">
                          {service.name}
                          <ArrowRight className="size-3.5" aria-label="から" />
                          <ServiceLogo service={s.service} size="sm" />
                          <span className="font-bold">{s.service.name}</span>
                          <span className="num ml-auto text-subtle">{s.count}人</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <ul className="mt-4 space-y-2">
                {d.cancelComments.map(({ entry, profile }) => (
                  <li key={entry.sub.id} className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                    「{entry.sub.cancelReasonDetail}」
                    <span className="mt-1 block text-xs text-subtle">
                      @{profile.handle}・{yearMonth(entry.sub.cancelledOn)}に解約
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Block>

      {d.stacks.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-extrabold">{service.name}を使っている人の構成</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {d.stacks.map((s) => (
              <StackCard key={s.profile.id} stack={s} />
            ))}
          </div>
          <Link href={`/stacks?services=${service.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent-strong hover:underline">
            {service.name}を使っている構成をすべて見る
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      )}

      <section className="flex flex-col items-start gap-4 rounded-2xl bg-surface-3 p-6 md:flex-row md:items-center">
        <div className="flex-1">
          <p className="text-lg font-extrabold">{service.name}を使っていますか？</p>
          <p className="mt-1 text-sm text-muted">あなたの使い方を登録すると、検討中の人の参考になります。</p>
        </div>
        <Link href={`/welcome?service=${service.slug}`} className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-on-accent">
          <CirclePlus className="size-5" aria-hidden />
          自分の構成を登録する
        </Link>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function Num({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <dt className="text-xs font-bold text-subtle">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

function Bar({ ratio, tone = "accent" }: { ratio: number; tone?: "accent" | "muted" }) {
  return (
    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
      <div className={`h-full rounded-full ${tone === "accent" ? "bg-accent" : "bg-subtle"}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
    </div>
  );
}

function Shortage() {
  return <p className="text-sm text-muted">利用者が{MIN_USERS_FOR_STATS}人以上になったら表示します（個人が特定されないようにするため）。</p>;
}
