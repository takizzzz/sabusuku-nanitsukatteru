import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { SimilarStackItem, SizedAvatar } from "@/components/detail/stack-extras";
import { PairChips } from "@/components/pair-chips";
import { ServiceLogo } from "@/components/service-logo";
import { Stars } from "@/components/stars";
import { getIndex } from "@/lib/data";
import { percent, yen } from "@/lib/format";
import { buildStack, compareServices, MIN_USERS_FOR_STATS, pairSlug, parsePair, topPairs } from "@/lib/stacks";
import type { Plan, Service } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/compare/[pair]">): Promise<Metadata> {
  const { pair } = await params;
  const idx = await getIndex();
  const p = parsePair(idx, pair);
  if (!p) return {};
  const d = compareServices(idx, p[0], p[1]);
  const title = `${p[0].name}と${p[1].name}の使い分け・併用している人`;
  return {
    title,
    description: `${p[0].name}と${p[1].name}を両方契約している${d.coUsers}人が、それぞれを何に使っているか。月額と満足度も比較。`,
    alternates: { canonical: `/compare/${pairSlug(p[0], p[1])}` },
  };
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

const cycle = (p: Plan) => (p.billingCycle === "yearly" ? "年" : "月");

/** 見出し（左の色バー＋タイトル＋右の補足） */
function SectionHead({ id, bar, title, note }: { id: string; bar: string; title: string; note?: ReactNode }) {
  return (
    <div className="mb-space-sm flex items-center justify-between gap-2 lg:mb-space-md">
      <div className="flex items-center gap-2">
        <span className={`h-4 w-1.5 rounded-full lg:h-5 ${bar}`} aria-hidden />
        <h2 id={id} className="font-headline-sm text-headline-sm font-bold text-on-surface lg:font-headline-md lg:text-headline-md">
          {title}
        </h2>
      </div>
      {note && <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{note}</span>}
    </div>
  );
}

/** S-06 併用比較（F-15） */
export default async function ComparePage({ params }: PageProps<"/compare/[pair]">) {
  const { pair } = await params;
  const idx = await getIndex();
  const p = parsePair(idx, pair);
  if (!p) notFound();
  const canonical = pairSlug(p[0], p[1]);
  if (pair !== canonical) permanentRedirect(`/compare/${canonical}`);

  const d = compareServices(idx, p[0], p[1]);
  const { a, b } = d;
  const others = topPairs(idx, 9).filter((x) => pairSlug(x.a, x.b) !== canonical).slice(0, 6);
  const voices = d.comments.slice(0, 6).map((c) => ({ ...c, stack: buildStack(idx, c.profile) }));
  const sides = [
    { s: a, other: b, accent: "text-primary", bar: ["bg-primary", "bg-primary-container", "bg-primary/70", "bg-primary-fixed-dim", "bg-primary/50"] },
    {
      s: b,
      other: a,
      accent: "text-tertiary-container dark:text-tertiary",
      bar: ["bg-tertiary-container", "bg-tertiary-fixed-dim", "bg-tertiary-container/70", "bg-tertiary-fixed-dim/80", "bg-tertiary-container/50"],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl pb-8 lg:max-w-5xl lg:px-margin lg:py-space-lg">
      {/* ヒーロー */}
      <section className="relative w-full overflow-hidden px-margin-mobile pt-3 pb-4 lg:px-0 lg:pt-0 lg:pb-space-lg">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-variant p-space-md shadow-sm lg:p-space-lg">
          <div className="pointer-events-none absolute -right-6 -bottom-6 size-28 rounded-full bg-primary/10 blur-xl lg:size-64" />
          <div className="pointer-events-none absolute -top-6 -left-6 size-24 rounded-full bg-tertiary/10 blur-xl lg:size-56" />
          <div className="relative mb-space-sm flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm">
              <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
              使い分け・併用分析
            </span>
          </div>
          <div className="relative mx-auto my-space-sm flex max-w-xl items-center justify-between gap-space-xs lg:gap-space-md">
            <ServiceHead service={a.service} plan={a.plans[0]} />
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex size-8 -rotate-6 items-center justify-center rounded-full bg-primary text-[13px] font-extrabold text-on-primary shadow-md lg:size-12 lg:text-base">
                VS
              </div>
              <span className="num mt-1 text-[10px] font-bold tracking-tight text-primary lg:text-label-sm">{d.coUsers}人が併用</span>
            </div>
            <ServiceHead service={b.service} plan={b.plans[0]} />
          </div>
          <div className="relative mt-space-sm text-center">
            <h1 className="font-headline-md text-headline-md font-extrabold tracking-tight text-on-surface lg:font-headline-lg lg:text-headline-lg">
              {a.service.name}と{b.service.name}、<br className="lg:hidden" />
              両方使う人はどう使い分けてる？
            </h1>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant lg:font-body-md lg:text-body-md">
              両方を契約している人の使い分けを、登録された構成から集計しています。
            </p>
          </div>
          {a.users > 0 && (
            <div className="relative mx-auto mt-space-md flex max-w-xl items-center gap-2.5 rounded-lg bg-primary/10 p-2.5 text-on-surface">
              <Icon name="insights" className="fill shrink-0 text-[22px] text-primary" />
              <p className="font-body-sm text-body-sm leading-snug">
                {a.service.name}の契約者{a.users}人のうち <span className="num font-price-md text-price-md font-extrabold text-primary">{percent(a.coRate)}</span>{" "}
                が{b.service.name}も契約しています。
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 数字 */}
      <section className="my-1 px-margin-mobile lg:my-0 lg:mb-space-lg lg:px-0" aria-label="数字">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-container-low p-3 shadow-sm lg:p-space-md">
          <Stat label="両方合計月額" value={d.avgPairMonthly !== null ? `約 ¥${yen(Math.round(d.avgPairMonthly))}` : "データ不足"} note="併用者の平均" />
          <Stat label="構成全体の月額" value={d.avgStackMonthly !== null ? `約 ¥${yen(Math.round(d.avgStackMonthly))}` : "データ不足"} note="併用者の平均" accent={d.avgStackMonthly !== null} />
          <Stat label="併用している人" value={`${d.coUsers}人`} note="登録データ" />
        </div>
        {!d.enough && (
          <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
            平均は併用している人が{MIN_USERS_FOR_STATS}人以上になったら表示します（個人が特定されないようにするため）。
          </p>
        )}
      </section>

      {/* 料金と満足度 */}
      <section className="mt-space-md px-margin-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-labelledby="specs">
        <SectionHead id="specs" bar="bg-primary" title="料金と満足度の早見表" note="公式の参考価格" />
        <div className="divide-y divide-surface-container overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <SpecRow label="プラン">
            {[a, b].map((s) => (
              <div key={s.service.id} className="rounded-lg bg-surface-container-low px-2 py-1.5 text-center">
                <span className="block text-[11px] text-on-surface-variant">{s.service.name}</span>
                {s.plans.length === 0 ? (
                  <span className="font-body-sm text-body-sm text-on-surface-variant">未登録</span>
                ) : (
                  <ul className="space-y-0.5">
                    {s.plans.map((pl) => (
                      <li key={pl.id} className="flex flex-wrap items-baseline justify-center gap-x-1">
                        <span className="text-[11px] text-on-surface-variant">{pl.name}</span>
                        <span className="num font-price-md text-price-md font-bold text-on-surface">
                          ¥{yen(pl.price)}
                          <span className="text-[11px] font-normal">/{cycle(pl)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </SpecRow>
          <SpecRow label="併用者の満足度">
            {[a, b].map((s) => (
              <div key={s.service.id} className="flex flex-col items-center justify-center gap-0.5 rounded-lg bg-surface-container-low p-2 text-center">
                {s.avgSatisfaction !== null ? (
                  <>
                    <Stars value={s.avgSatisfaction} size="sm" />
                    <span className="num font-price-md text-price-md font-bold text-on-surface">{s.avgSatisfaction.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="font-body-sm text-[11px] leading-snug text-on-surface-variant">データ不足</span>
                )}
              </div>
            ))}
          </SpecRow>
          <SpecRow label="併用率">
            {sides.map(({ s, other, accent }) => (
              <div key={s.service.id} className="rounded-lg bg-surface-container-low p-2 text-on-surface">
                <span className={`num font-price-md text-price-md font-extrabold ${accent}`}>{percent(s.coRate)}</span>
                <p className="mt-1 font-body-sm text-[11px] leading-snug text-on-surface-variant">
                  {s.service.name}の契約者{s.users}人のうち{other.service.name}も契約
                </p>
              </div>
            ))}
          </SpecRow>
        </div>
      </section>

      {/* 使い分け */}
      <section className="mt-space-lg px-margin-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-labelledby="usage">
        <SectionHead id="usage" bar="bg-secondary" title="リアルな使い分け実態" note={<span className="num">n={d.coUsers}人</span>} />
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-gutter">
          {sides.map(({ s, accent, bar }) => (
            <div key={s.service.id} className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm lg:p-space-lg">
              <div className="flex items-center gap-2 pb-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-low">
                  <ServiceLogo service={s.service} size="sm" />
                </span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{s.service.name} に任せるシーン</h3>
              </div>
              {s.tagShares.length === 0 ? (
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">まだ用途タグがありません。</p>
              ) : !d.enough ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.tagShares.map((t) => (
                    <span key={t.tag} className="rounded-full bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm text-on-surface">
                      <span className={`font-bold ${accent}`}>#</span> {t.tag}
                    </span>
                  ))}
                </div>
              ) : (
                <ul className="mt-2 space-y-3">
                  {s.tagShares.map((t, i) => (
                    <li key={t.tag}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-label-md text-label-md text-on-surface">
                          <span className={`font-bold ${accent}`}>#</span> {t.tag}
                        </span>
                        <span className={`num font-price-md text-price-md font-bold ${accent}`}>{percent(t.ratio)}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className={`h-full rounded-full ${bar[i] ?? bar[0]}`} style={{ width: `${Math.round(t.ratio * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 生の声 */}
      {voices.length > 0 && (
        <section className="mt-space-lg px-margin-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-labelledby="voices">
          <SectionHead id="voices" bar="bg-primary-container" title="併用ユーザーの生の声" note={<span className="num font-bold text-primary">{d.comments.length}件</span>} />
          <div className="grid gap-3 lg:grid-cols-2 lg:gap-gutter">
            {voices.map((c) => (
              <article key={c.profile.id} className="flex flex-col rounded-xl bg-surface-container-lowest p-space-md shadow-sm lg:p-space-lg">
                <Link href={`/@${c.profile.handle}`} className="mb-2 flex items-center gap-2.5 hover:opacity-80">
                  <SizedAvatar stack={c.stack} className="*:size-10! *:text-base!" />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">{c.profile.displayName}</span>
                      {c.profile.occupation && (
                        <span className="shrink-0 rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                          {c.profile.occupation}
                        </span>
                      )}
                    </div>
                    <span className="num font-body-sm text-[11px] text-on-surface-variant">スタック合計: ¥{yen(c.stack.monthlyTotal)}/月</span>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col gap-2">
                  {[c.a, c.b].map(
                    (e) =>
                      e.sub.comment && (
                        <div key={e.sub.id}>
                          <p className="flex items-center justify-between gap-2">
                            <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">{e.service.name}</span>
                            {e.sub.satisfaction !== null && (
                              <span className="inline-flex items-center gap-0.5 font-label-sm text-label-sm font-bold text-amber-500 dark:text-amber-400">
                                <Icon name="star" className="fill text-[15px]" />
                                <span className="num">{e.sub.satisfaction}</span>
                                <span className="sr-only">（満足度）</span>
                              </span>
                            )}
                          </p>
                          <p className="font-body-md text-body-md leading-relaxed text-on-surface">「{e.sub.comment}」</p>
                        </div>
                      ),
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 pt-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {c.profile.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded-full bg-surface-container-low px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span className="flex shrink-0 items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                    <Icon name="favorite" className="text-[16px]" />
                    <span className="num">{c.stack.likeCount}</span>
                    <span className="sr-only">いいね</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 両方使っている人の構成 */}
      {d.stacks.length > 0 && (
        <section className="mt-space-lg px-margin-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-labelledby="stacks">
          <SectionHead id="stacks" bar="bg-secondary-container" title="両方使っている人の構成" />
          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-3 lg:gap-gutter">
            {d.stacks.map((s) => (
              <SimilarStackItem key={s.profile.id} stack={s} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-space-lg px-margin-mobile lg:mt-0 lg:mb-space-xl lg:px-0">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container p-space-md text-on-primary shadow-md lg:p-space-lg dark:from-primary-container dark:to-tertiary-container dark:text-on-primary-container">
          <Icon name="splitscreen" className="pointer-events-none absolute -right-4 -bottom-6 text-[110px] opacity-10 select-none lg:text-[160px]" />
          <div className="relative z-10 lg:flex lg:items-end lg:justify-between lg:gap-space-lg">
            <div>
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/20 px-2.5 py-0.5 font-label-sm text-label-sm backdrop-blur-sm">
                <Icon name="psychology_alt" className="text-[14px]" /> あなたのスタイルは？
              </span>
              <h2 className="font-headline-md text-headline-md leading-tight font-bold">あなたはどう使い分けてる？</h2>
              <p className="mt-1.5 font-body-sm text-body-sm leading-relaxed opacity-90">
                自分のサブスク構成と使い分けを登録して、みんなにシェアしよう。
              </p>
            </div>
            <div className="mt-space-md lg:mt-0 lg:shrink-0">
              <Link
                href="/welcome"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-3 font-headline-sm text-headline-sm font-bold text-primary shadow transition-all hover:bg-surface-container-low active:scale-[0.98] lg:w-auto lg:px-space-lg"
              >
                <span>自分の使い分けを登録してシェア</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-space-lg mb-2 px-margin-mobile lg:mt-0 lg:px-0" aria-labelledby="others">
          <div className="mb-space-sm flex items-center gap-2">
            <Icon name="alt_route" className="text-[18px] text-on-surface-variant" />
            <h2 id="others" className="font-headline-sm text-headline-sm font-bold text-on-surface">
              他の定番併用ペア
            </h2>
          </div>
          <PairChips pairs={others} />
        </section>
      )}
    </div>
  );
}

function ServiceHead({ service, plan }: { service: Service; plan?: Plan }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="flex min-w-0 flex-1 flex-col items-center rounded-lg bg-surface-container-lowest p-3 shadow-sm transition-opacity hover:opacity-90 lg:p-space-md"
    >
      <span className="mb-1.5 flex size-12 items-center justify-center rounded-xl bg-surface-container shadow-inner lg:size-16">
        <span className="*:size-10! lg:*:size-12!">
          <ServiceLogo service={service} size="lg" />
        </span>
      </span>
      <span className="w-full truncate text-center font-headline-sm text-headline-sm leading-tight font-bold text-on-surface lg:font-headline-md lg:text-headline-md">
        {service.name}
      </span>
      {plan && (
        <span className="num mt-0.5 font-label-sm text-label-sm font-medium text-on-surface-variant">
          {plan.name} (¥{yen(plan.price)}/{cycle(plan)})
        </span>
      )}
    </Link>
  );
}

function Stat({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">{label}</span>
      <span className={`num mt-0.5 font-price-md text-price-md font-bold lg:font-price-lg lg:text-price-lg ${accent ? "text-primary" : "text-on-surface"}`}>
        {value}
      </span>
      <span className="font-body-sm text-[10px] text-on-surface-variant lg:text-body-sm">{note}</span>
    </div>
  );
}

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 p-3.5 lg:p-space-md">
      <span className="w-20 shrink-0 pt-1 font-label-md text-label-md text-on-surface-variant lg:w-32">{label}</span>
      <div className="grid flex-1 grid-cols-2 gap-2">{children}</div>
    </div>
  );
}
