import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, ChartNoAxesColumn, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { PairChips } from "@/components/pair-chips";
import { ServiceLogo } from "@/components/service-logo";
import { StackCard } from "@/components/stack-card";
import { Stars } from "@/components/stars";
import { getIndex } from "@/lib/data";
import { percent, yen } from "@/lib/format";
import { compareServices, MIN_USERS_FOR_STATS, pairSlug, parsePair, topPairs } from "@/lib/stacks";
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-b from-accent-soft to-surface-2 p-5 md:p-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-accent-strong">
          <ChartNoAxesColumn className="size-3.5" aria-hidden />
          使い分け・併用分析
        </p>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ServiceHead service={a.service} plan={a.plans[0]} />
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-on-accent shadow">VS</span>
          <ServiceHead service={b.service} plan={b.plans[0]} />
        </div>
        <h1 className="mt-6 text-center text-2xl leading-snug font-extrabold md:text-3xl">
          {a.service.name}と{b.service.name}、
          <br className="md:hidden" />
          両方使う人はどう使い分けてる？
        </h1>
      </section>

      <section className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-card py-4 text-center" aria-label="数字">
        <Stat label="両方を契約している人" value={`${d.coUsers}人`} />
        <Stat label="2つの月額（平均）" value={d.avgPairMonthly !== null ? `¥${yen(Math.round(d.avgPairMonthly))}` : "データ不足"} />
        <Stat label="構成全体の月額（平均）" value={d.avgStackMonthly !== null ? `¥${yen(Math.round(d.avgStackMonthly))}` : "データ不足"} />
      </section>
      {!d.enough && (
        <p className="-mt-5 text-xs text-subtle">平均は併用している人が{MIN_USERS_FOR_STATS}人以上になったら表示します（個人が特定されないようにするため）。</p>
      )}

      <section aria-labelledby="specs">
        <h2 id="specs" className="mb-3 text-xl font-extrabold">料金と併用率</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[a, b].map((s, i) => {
            const other = i === 0 ? b : a;
            return (
              <div key={s.service.id} className="rounded-2xl border border-line bg-card p-5">
                <div className="flex items-center gap-2">
                  <ServiceLogo service={s.service} size="sm" />
                  <Link href={`/services/${s.service.slug}`} className="font-bold hover:underline">
                    {s.service.name}
                  </Link>
                  {s.avgSatisfaction !== null && (
                    <span className="ml-auto flex items-center gap-1 text-sm font-bold">
                      <Stars value={Math.round(s.avgSatisfaction)} />
                      <span className="num">{s.avgSatisfaction.toFixed(1)}</span>
                    </span>
                  )}
                </div>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {s.plans.map((pl) => (
                    <li key={pl.id} className="flex justify-between py-1.5">
                      <span>{pl.name}</span>
                      <span className="num font-bold">
                        ¥{yen(pl.price)}
                        <span className="text-xs font-normal text-subtle">/{pl.billingCycle === "yearly" ? "年" : "月"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  {s.service.name}の契約者{s.users}人のうち<span className="num mx-1 font-extrabold text-accent-strong">{percent(s.coRate)}</span>が{other.service.name}も契約
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="usage">
        <h2 id="usage" className="mb-3 text-xl font-extrabold">それぞれ何に使ってる？</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[a, b].map((s) => (
            <div key={s.service.id} className="rounded-2xl border border-line bg-card p-5">
              <p className="mb-3 flex items-center gap-2 font-bold">
                <ServiceLogo service={s.service} size="sm" />
                {s.service.name}に任せていること
              </p>
              {s.tagShares.length === 0 ? (
                <p className="text-sm text-muted">まだ用途タグがありません。</p>
                ) : !d.enough ? (
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  {s.tagShares.map((t) => (
                    <span key={t.tag} className="text-sm font-semibold text-accent-strong">
                      #{t.tag}
                    </span>
                  ))}
                </p>
              ) : (
                <ul className="space-y-3">
                  {s.tagShares.map((t) => (
                    <li key={t.tag}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">#{t.tag}</span>
                        <span className="num font-bold">{percent(t.ratio)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(t.ratio * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {d.comments.length > 0 && (
        <section aria-labelledby="voices">
          <h2 id="voices" className="mb-3 text-xl font-extrabold">
            併用している人の使い分け <span className="num text-base text-subtle">{d.comments.length}件</span>
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {d.comments.slice(0, 6).map((c) => (
              <li key={c.profile.id} className="rounded-2xl border border-line bg-card p-5">
                <Link href={`/@${c.profile.handle}`} className="flex items-center gap-2 hover:opacity-80">
                  <Avatar profile={c.profile} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{c.profile.displayName}</span>
                    {c.profile.occupation && <span className="block text-xs text-subtle">{c.profile.occupation}</span>}
                  </span>
                </Link>
                <dl className="mt-3 space-y-2 text-sm">
                  {[c.a, c.b].map(
                    (e) =>
                      e.sub.comment && (
                        <div key={e.sub.id} className="rounded-lg bg-surface-2 px-3 py-2">
                          <dt className="text-xs font-bold text-subtle">{e.service.name}</dt>
                          <dd>{e.sub.comment}</dd>
                        </div>
                      ),
                  )}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}

      {d.stacks.length > 0 && (
        <section aria-labelledby="stacks">
          <h2 id="stacks" className="mb-3 text-xl font-extrabold">両方使っている人の構成</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.stacks.map((s) => (
              <StackCard key={s.profile.id} stack={s} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-accent p-6 text-on-accent md:p-8">
        <p className="flex items-center gap-1.5 text-xs font-bold opacity-90">
          <Users className="size-4" aria-hidden />
          あなたはどう使い分けてる？
        </p>
        <p className="mt-2 text-xl font-extrabold">自分のサブスク構成を登録して、使い分けを共有しよう</p>
        <Link href="/welcome" className="mt-4 inline-flex min-h-12 items-center gap-1.5 rounded-xl bg-card px-5 font-bold text-accent-strong">
          構成を登録する
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="others">
          <h2 id="others" className="mb-3 text-lg font-extrabold">よく併用されている組み合わせ</h2>
          <PairChips pairs={others} />
        </section>
      )}
    </div>
  );
}

function ServiceHead({ service, plan }: { service: Service; plan?: Plan }) {
  return (
    <Link href={`/services/${service.slug}`} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center shadow-sm hover:opacity-90">
      <ServiceLogo service={service} size="lg" />
      <span className="w-full truncate font-extrabold">{service.name}</span>
      {plan && (
        <span className="text-xs text-subtle">
          {plan.name} ¥{yen(plan.price)}/{plan.billingCycle === "yearly" ? "年" : "月"}
        </span>
      )}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <p className="num text-lg font-extrabold md:text-2xl">{value}</p>
      <p className="text-[11px] text-subtle md:text-xs">{label}</p>
    </div>
  );
}
