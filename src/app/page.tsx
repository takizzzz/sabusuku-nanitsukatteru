import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { RankingTabs } from "@/components/ranking-tabs";
import { Section } from "@/components/section";
import { ServiceLogo } from "@/components/service-logo";
import { StackCard } from "@/components/stack-card";
import { monthlyOfPlan } from "@/lib/catalog";
import { getIndex } from "@/lib/data";
import { percent, relativeDay, yen } from "@/lib/format";
import {
  type ServiceStat,
  type Stack,
  buildStack,
  listableProfiles,
  occupationCounts,
  ranking,
  siteStats,
  statProfiles,
} from "@/lib/stacks";

export const revalidate = 300;

const CATEGORY_EMOJI: Record<string, string> = {
  ai: "🤖",
  video: "🎬",
  music: "🎵",
  work: "💼",
  learning: "📚",
};

export default async function TopPage() {
  const idx = await getIndex();
  const stacks = listableProfiles(idx)
    .map((p) => buildStack(idx, p))
    .filter((s) => s.active.length > 0);
  const popular = [...stacks].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6);
  const newest = [...stacks]
    .sort((a, b) => b.profile.updatedAt.localeCompare(a.profile.updatedAt))
    .slice(0, 6);
  const stats = siteStats(idx);
  const aiByUsers = ranking(idx, "users", { categorySlug: "ai", limit: 5 });
  const aiBySatisfaction = ranking(idx, "satisfaction", { categorySlug: "ai", limit: 5 });
  const categories = [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const topOccupations = occupationCounts(idx)
    .slice(0, 3)
    .map((o) => o.occupation);
  // 解約・見直しされたサブスクの月額の合計（統計対象の構成から集計）
  const cancelledMonthly = statProfiles(idx)
    .map((p) => buildStack(idx, p))
    .reduce((sum, s) => sum + s.cancelled.reduce((n, e) => n + e.sub.monthlyPrice, 0), 0);
  const pile = popular.slice(0, 3);
  const pileRest = stats.stackCount - pile.length;

  const rankingTabs = [
    { label: "利用者数順", content: <RankingList stats={aiByUsers} /> },
    ...(aiBySatisfaction.length > 0 ? [{ label: "満足度順", content: <RankingList stats={aiBySatisfaction} /> }] : []),
  ];

  return (
    <div className="flex w-full flex-col pb-10">
      {/* 1. ヒーロー */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-secondary-fixed/40 blur-3xl md:size-96" />
        <div aria-hidden className="pointer-events-none absolute top-36 -left-12 size-48 rounded-full bg-primary-fixed/40 blur-2xl md:size-80" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-space-md px-margin-mobile pt-space-md pb-space-lg md:px-margin md:pt-space-xl md:pb-space-xl lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-space-xl">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 font-label-md text-label-md text-primary shadow-sm">
                <span className="text-sm" aria-hidden>
                  ✨
                </span>
                <span>リアルな月額と使い分けをオープンに</span>
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <h1 className="font-display-hero-mobile text-display-hero-mobile leading-tight tracking-tight text-on-surface md:font-display-hero md:text-display-hero lg:text-[56px] lg:leading-[64px]">
                みんな、サブスク
                <br />
                <span className="text-primary-container dark:text-primary">なにつかってる！？</span>
              </h1>
              <p className="max-w-xl pt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant md:font-body-lg md:text-body-lg">
                生成AIから動画・音楽、仕事ツールまで。みんなの契約一覧と「どう使い分けているか」がひと目でわかる共有サービス
              </p>
            </div>
            <div className="flex flex-col gap-space-xs pt-1 sm:flex-row sm:gap-space-sm">
              <Link
                href="/welcome"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-headline-sm text-headline-sm text-white shadow-md shadow-primary/20 transition-all active:scale-[0.98] sm:w-auto sm:px-space-lg"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden>
                  add_circle
                </span>
                <span>自分のサブスクを登録する</span>
              </Link>
              <Link
                href="#popular-stacks"
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest font-headline-sm text-headline-sm text-on-surface shadow-sm transition-all active:bg-surface-container-low sm:h-12 sm:w-auto sm:px-space-lg"
              >
                <span>みんなの構成を見る</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant" aria-hidden>
                  arrow_downward
                </span>
              </Link>
            </div>
            {stacks.length > 0 && (
              <div className="flex items-center gap-space-xs pt-1">
                <div className="flex shrink-0 -space-x-2">
                  {pile.map((s) => (
                    <Avatar key={s.profile.id} profile={s.profile} size="sm" className="size-8! text-xs shadow-sm ring-2 ring-surface" />
                  ))}
                  {pileRest > 0 && (
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary-container font-label-sm text-label-sm font-bold text-on-secondary-container shadow-sm ring-2 ring-surface">
                      +{yen(pileRest)}
                    </span>
                  )}
                </div>
                <p className="font-label-sm text-label-sm leading-snug font-normal text-on-surface-variant">
                  {topOccupations.length > 0 && `${topOccupations.join("、")}など `}
                  <strong className="font-bold text-on-surface">{yen(stats.stackCount)}人</strong> が構成を公開中
                </p>
              </div>
            )}
          </div>

          {/* ちょい見せカード（SP は横スクロール、PC は縦に重ねる） */}
          <ul
            className="scrollbar-none -mx-margin-mobile flex snap-x snap-mandatory gap-space-sm overflow-x-auto px-margin-mobile pt-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
            aria-label="人気の構成から"
          >
            {popular.slice(0, 3).map((s, i) => (
              <li key={s.profile.id} className={`w-72 shrink-0 snap-start lg:w-auto ${i === 1 ? "lg:ml-10" : i === 2 ? "lg:ml-4" : ""}`}>
                <PeekCard stack={s} accent={i % 2 === 1} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. 全体の統計 */}
      <section className="mx-auto w-full max-w-7xl px-margin-mobile py-space-sm md:px-margin" aria-label="全体の統計">
        <dl className="grid grid-cols-2 gap-space-xs rounded-xl bg-surface-container-low p-space-xs shadow-sm md:grid-cols-4 md:gap-space-sm md:p-space-sm">
          <Stat icon="layers" label="公開された構成">
            <div className="mt-1 flex items-baseline gap-1">
              <span className="num font-price-xl text-price-xl font-extrabold tracking-tight text-on-surface">{yen(stats.stackCount)}</span>
              <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">件</span>
            </div>
          </Stat>
          <Stat icon="payments" label="平均月額支出" note={`中央値: ¥${yen(stats.medianMonthly)}`}>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="num font-price-lg text-price-lg font-extrabold tracking-tight text-on-surface">¥{yen(stats.avgMonthly)}</span>
              <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">/月</span>
            </div>
          </Stat>
          <Stat
            icon="military_tech"
            label="人気No.1ツール"
            note={stats.topService ? `利用率 ${percent(stats.topService.usageRate)}` : undefined}
          >
            <div className="mt-1 truncate font-headline-sm text-headline-sm font-bold text-primary">
              {stats.topService?.service.name ?? "—"}
            </div>
          </Stat>
          <Stat
            icon="savings"
            label="見直し・解約"
            note={cancelledMonthly > 0 ? `合計 ¥${yen(cancelledMonthly)}/月 分` : undefined}
          >
            <div className="mt-1 flex items-baseline gap-1">
              <span className="num font-price-lg text-price-lg font-extrabold tracking-tight text-tertiary">{yen(stats.cancelCount)}</span>
              <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">件</span>
            </div>
          </Stat>
        </dl>
      </section>

      {/* 3. カテゴリ */}
      <nav aria-label="カテゴリ別ランキング" className="mx-auto w-full max-w-7xl pt-space-md pb-space-xs md:px-margin">
        <ul className="scrollbar-none flex items-center gap-2 overflow-x-auto px-margin-mobile md:flex-wrap md:px-0">
          <li>
            <Link
              href="/ranking"
              className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-on-surface px-3.5 font-label-md text-label-md font-medium whitespace-nowrap text-surface shadow-sm transition-all active:scale-95"
            >
              すべて
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/ranking?category=${c.slug}`}
                className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-container-lowest px-3.5 font-label-md text-label-md font-medium whitespace-nowrap text-on-surface-variant shadow-sm transition-all hover:text-on-surface active:bg-surface-container"
              >
                {CATEGORY_EMOJI[c.slug] && <span aria-hidden>{CATEGORY_EMOJI[c.slug]}</span>}
                <span>{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 4. 人気の構成 */}
      <Section id="popular-stacks" title="人気の構成" icon="🔥" more={{ href: "/stacks", label: "もっと探す" }} className="scroll-mt-20 pt-space-md">
        <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2 md:gap-gutter lg:grid-cols-3">
          {popular.map((s, i) => (
            <div key={s.profile.id} className={`flex min-w-0 [&>*]:w-full ${i >= 3 ? "max-md:hidden" : ""}`}>
              <StackCard stack={s} variant="feed" />
            </div>
          ))}
        </div>
      </Section>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-y-0 lg:grid-cols-2 lg:gap-x-gutter lg:px-margin">
        {/* 5. 注目のAIツール */}
        <Section title="注目のAIツール" icon="👑" className="pt-space-lg lg:px-0!">
          <RankingTabs tabs={rankingTabs} />
          <Link
            href="/ranking?category=ai"
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-surface-container-high py-2.5 font-label-md text-label-md font-bold text-primary transition-colors active:bg-surface-container"
          >
            <span>AIツールの総合ランキングをもっと見る</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden>
              arrow_forward
            </span>
          </Link>
          <p className="font-label-sm text-label-sm font-normal text-outline">
            順位は広告・アフィリエイトの有無に関係なく、登録データだけで決めています。
          </p>
        </Section>

        {/* 6. 新着の構成 */}
        <Section
          title="新着の構成"
          icon={<span className="inline-block size-2.5 animate-pulse rounded-full bg-emerald-500" />}
          className="pt-space-lg lg:px-0!"
        >
          <ul className="flex flex-col gap-space-sm">
            {newest.map((s, i) => (
              <li key={s.profile.id} className={i >= 3 ? "max-md:hidden" : ""}>
                <NewStackRow stack={s} />
              </li>
            ))}
          </ul>
          <Link
            href="/stacks?sort=new"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-lowest py-3 font-headline-sm text-headline-sm text-on-surface shadow-sm transition-colors active:bg-surface-container"
          >
            <span>すべての構成（{yen(stacks.length)}件）を見る</span>
            <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden>
              arrow_forward
            </span>
          </Link>
        </Section>
      </div>

      {/* 7. 登録 CTA */}
      <section className="mx-auto w-full max-w-7xl px-margin-mobile pt-space-lg md:px-margin md:pt-space-xl">
        <div className="relative flex flex-col gap-space-sm overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-container to-inverse-surface p-space-md text-white shadow-xl md:flex-row md:items-center md:gap-space-xl md:p-space-xl dark:from-primary-container dark:via-primary-container dark:to-inverse-primary">
          <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-12 size-48 rounded-full bg-white/10 blur-xl md:size-80" />
          <div className="relative z-10 flex flex-col gap-space-sm md:flex-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-white/20 px-2 py-0.5 font-label-sm text-label-sm font-semibold tracking-wide text-white uppercase">
                Share your stack
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-white md:font-headline-lg md:text-headline-lg">
                あなたの使っている
                <br />
                サブスク、いくら？
              </h2>
              <p className="pt-1 font-body-sm text-body-sm leading-relaxed text-white/80 md:font-body-md md:text-body-md">
                人気のサービスを選んで月額を入れるだけ。合計額のカード画像が自動でできて、X や LINE で手軽にシェアできます。無駄遣いの見直しにも。
              </p>
            </div>
          </div>
          <div className="relative z-10 flex flex-col gap-space-sm md:w-96">
            <div className="flex items-center justify-between rounded-xl bg-white/15 p-space-xs text-white backdrop-blur-md md:p-space-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold" aria-hidden>
                  📊
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-white/90">あなたのサブスク総額カード</span>
                  <span className="font-price-md text-price-md font-black text-white">¥??,??? / 月</span>
                </div>
              </div>
              <span className="rounded bg-white px-2 py-0.5 font-label-sm text-label-sm font-bold text-primary-container">自動作成</span>
            </div>
            <Link
              href="/welcome"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-surface font-headline-sm text-headline-sm text-primary shadow-lg transition-all active:scale-[0.98]"
            >
              <span>今すぐ自分の構成を作る</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, note, children }: { icon: string; label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-surface-container-lowest p-space-sm md:p-space-md">
      <dt className="flex items-center gap-1 text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]" aria-hidden>
          {icon}
        </span>
        <span className="font-label-sm text-label-sm">{label}</span>
      </dt>
      <dd>{children}</dd>
      {note && <dd className="truncate font-label-sm text-label-sm font-normal text-outline">{note}</dd>}
    </div>
  );
}

/** ヒーローのちょい見せカード */
function PeekCard({ stack, accent }: { stack: Stack; accent: boolean }) {
  const { profile, active } = stack;
  const shown = active.slice(0, 3);
  const rest = active.length - shown.length;
  return (
    <Link
      href={`/@${profile.handle}`}
      className="relative flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-space-sm shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar profile={profile} size="xs" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-label-md text-label-md leading-tight font-bold text-on-surface">
              {profile.occupation ?? profile.displayName}
              {profile.ageRange && ` (${profile.ageRange})`}
            </span>
            <span className="truncate font-label-sm text-label-sm leading-none font-normal text-outline">@{profile.handle}</span>
          </div>
        </div>
        <span className={`num shrink-0 font-price-md text-price-md ${accent ? "text-tertiary" : "text-primary"}`}>
          ¥{yen(stack.monthlyTotal)}
          <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">/月</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 overflow-hidden rounded-lg bg-surface-container-low p-1.5">
        {shown.map((e) => (
          <span key={e.sub.id} className="truncate rounded bg-surface-container-lowest px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-surface">
            {e.service.name}
          </span>
        ))}
        {rest > 0 && <span className="ml-auto shrink-0 font-label-sm text-label-sm text-outline">+{rest}</span>}
      </div>
    </Link>
  );
}

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"];

function RankingList({ stats }: { stats: ServiceStat[] }) {
  return (
    <ol className="flex flex-col gap-space-xs rounded-xl bg-surface-container-lowest p-space-xs shadow-sm">
      {stats.map((s, i) => {
        const plan = s.representativePlan;
        return (
          <li key={s.service.id}>
            <Link
              href={`/services/${s.service.slug}`}
              className="group flex items-center justify-between gap-space-xs rounded-lg p-space-sm transition-colors hover:bg-surface-container-low"
            >
              <div className="flex min-w-0 items-center gap-space-xs">
                <span className={`num w-6 shrink-0 text-center font-display-hero-mobile text-[18px] font-extrabold ${RANK_COLORS[i] ?? "text-outline"}`}>
                  {i + 1}
                </span>
                <ServiceLogo service={s.service} size="md" />
                <div className="flex min-w-0 flex-col">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-headline-sm text-headline-sm text-on-surface">{s.service.name}</span>
                    {s.service.company && (
                      <span className="shrink-0 rounded bg-surface-container px-1 font-label-sm text-[10px] text-outline">{s.service.company}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 font-label-sm text-label-sm font-normal text-on-surface-variant">
                    {plan && <span className="num font-semibold text-primary">¥{yen(monthlyOfPlan(plan))}/月</span>}
                    {plan && <span aria-hidden>·</span>}
                    <span className="num">
                      {s.activeUsers}人({percent(s.usageRate)})
                    </span>
                    {s.avgSatisfaction !== null && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="num font-bold text-amber-600 dark:text-amber-400">
                          <span aria-hidden>★ </span>
                          <span className="sr-only">平均満足度</span>
                          {s.avgSatisfaction.toFixed(1)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="shrink-0 rounded bg-surface-container px-2.5 py-1.5 font-label-sm text-label-sm font-semibold text-on-surface-variant transition-all group-hover:bg-primary-container group-hover:text-white">
                詳細
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function NewStackRow({ stack }: { stack: Stack }) {
  const { profile, active } = stack;
  const line = [profile.occupation, active.map((e) => e.service.name).join(", ")].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/@${profile.handle}`}
      className="flex items-center justify-between gap-space-xs rounded-xl bg-surface-container-lowest p-space-sm shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex min-w-0 items-center gap-space-xs">
        <Avatar profile={profile} size="sm" />
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-label-md text-label-md font-bold text-on-surface">@{profile.handle}</span>
            <span className="shrink-0 font-label-sm text-label-sm font-normal text-outline">{relativeDay(profile.updatedAt)}</span>
          </div>
          <div className="truncate font-body-sm text-body-sm text-on-surface-variant">{line}</div>
        </div>
      </div>
      <span className="num shrink-0 font-price-md text-price-md font-bold text-on-surface">¥{yen(stack.monthlyTotal)}</span>
    </Link>
  );
}
