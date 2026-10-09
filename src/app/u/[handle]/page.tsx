import { SampleBadge, SampleNotice } from "@/components/sample-badge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SizedAvatar, SharePreviewCta, SimilarStackItem } from "@/components/detail/stack-extras";
import { ActiveSubscriptionCard, CancelledSubscriptionItem } from "@/components/detail/subscription-cards";
import { ShareButtons } from "@/components/share-buttons";
import { StackActions } from "@/components/stack-actions";
import { getIndex } from "@/lib/data";
import { SITE_URL, percent, yearMonth, yen } from "@/lib/format";
import { findStack, similarStacks, type CategoryShare } from "@/lib/stacks";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const stack = findStack(await getIndex(), handle);
  if (!stack) return {};
  const names = stack.active.map((e) => e.service.name).slice(0, 5).join("・");
  const title = `@${handle} のサブスク 月¥${yen(stack.monthlyTotal)}`;
  return {
    title,
    description: `${stack.profile.occupation ?? ""}の @${handle} さんが契約中のサブスク${stack.active.length}件（${names}）と使い分け。`,
    alternates: { canonical: `/@${handle}` },
    robots: stack.profile.visibility === "unlisted" ? { index: false, follow: false } : undefined,
    openGraph: { title, url: `/@${handle}` },
    twitter: { card: "summary_large_image", title },
  };
}

/** カテゴリ内訳の色（デザインのトークン順） */
const SHARE_COLORS = [
  "bg-primary",
  "bg-secondary lg:bg-secondary-fixed-dim",
  "bg-tertiary-container",
  "bg-primary-fixed-dim",
  "bg-secondary-container",
  "bg-outline-variant",
];
const shareColor = (i: number) => SHARE_COLORS[Math.min(i, SHARE_COLORS.length - 1)];

function slashDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${y}/${m}/${d}`;
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

function ShareTrack({ shares }: { shares: CategoryShare[] }) {
  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container-high shadow-inner lg:bg-surface-container lg:shadow-none"
      role="img"
      aria-label={`カテゴリ別の内訳：${shares.map((s) => `${s.category.name} ${percent(s.ratio)}`).join("、")}`}
    >
      {shares.map((s, i) => (
        <div key={s.category.id} className={`h-full ${shareColor(i)}`} style={{ width: `${s.ratio * 100}%` }} title={`${s.category.name} ${percent(s.ratio)}`} />
      ))}
    </div>
  );
}

/** S-03 構成詳細 */
export default async function StackPage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const idx = await getIndex();
  const stack = findStack(idx, handle);
  if (!stack) notFound();

  const { profile } = stack;
  const similar = profile.visibility === "public" ? similarStacks(idx, stack, 3) : [];
  const url = `${SITE_URL}/@${profile.handle}`;
  const from = `stack:${profile.handle}`;
  const priceDate = stack.active
    .map((e) => e.plan?.priceCheckedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const cancelledTotal = stack.cancelled.reduce((s, e) => s + e.sub.monthlyPrice, 0);
  const hasComments = stack.active.some((e) => e.sub.comment);
  const shares = stack.categoryShares;

  return (
    <div className="mx-auto w-full max-w-2xl pb-8 lg:max-w-7xl lg:px-margin lg:py-space-lg">
      {/* 戻る＋最終更新（SP） */}
      <div className="flex items-center justify-between px-gutter-mobile pt-3 pb-2 lg:hidden">
        <Link
          href="/stacks"
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span className="font-label-md text-label-md">探すに戻る</span>
        </Link>
        <span className="font-label-sm text-label-sm text-outline">最終更新: {slashDate(profile.updatedAt)}</span>
      </div>

      {profile.isSample && (
        <div className="mb-space-md px-gutter-mobile lg:px-0">
          <SampleNotice />
        </div>
      )}

      {/* プロフィール＋操作（SP は操作バーが上、PC はカードの右） */}
      <section className="flex flex-col gap-3 px-gutter-mobile lg:mb-space-lg lg:flex-row lg:items-center lg:justify-between lg:gap-space-md lg:rounded-xl lg:bg-surface-container-lowest lg:p-space-lg lg:shadow-md">
        <div className="order-first flex flex-wrap items-center gap-1.5 py-0.5 lg:order-last lg:shrink-0 lg:justify-end lg:gap-space-xs">
          <StackActions targetUserId={profile.id} handle={profile.handle} initialCount={stack.likeCount} />
          <ShareButtons
            variant="bar"
            url={url}
            text={`@${profile.handle} さんのサブスクは月¥${yen(stack.monthlyTotal)}！ #さぶすくなにつかってる`}
            reportHref={`/report?type=stack&id=${profile.id}`}
          />
        </div>
        <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-xl bg-surface-container-lowest p-space-md shadow-sm lg:mt-0 lg:min-w-0 lg:gap-x-space-md lg:gap-y-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <SizedAvatar stack={stack} className="self-center *:size-14! *:text-2xl! lg:row-span-3 lg:self-start lg:*:size-16!" />
          <div className="flex min-w-0 flex-col self-center lg:mb-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-space-xs">
            <h1 className="truncate font-headline-sm text-headline-sm text-on-surface lg:font-headline-md lg:text-headline-md">{profile.displayName}</h1>
            <span className="font-body-sm text-body-sm text-outline lg:text-on-surface-variant">@{profile.handle}</span>
            {profile.isSample && <SampleBadge />}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 lg:contents">
              {profile.occupation && (
                <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm font-medium text-on-surface-variant lg:bg-surface-container-high lg:px-space-xs lg:text-on-surface">
                  {profile.occupation}
                </span>
              )}
              {profile.ageRange && (
                <span className="rounded-full bg-surface-container-low px-1.5 py-0.5 font-label-sm text-label-sm text-outline lg:bg-surface-container lg:px-space-xs lg:text-on-surface-variant">
                  {profile.ageRange}
                </span>
              )}
              {profile.visibility === "unlisted" && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-container-low px-1.5 py-0.5 font-label-sm text-label-sm text-outline">
                  <Icon name="link" className="text-[12px]" />
                  限定公開
                </span>
              )}
            </div>
          </div>
          {profile.bio && (
            <p className="col-span-2 font-body-md text-body-md leading-relaxed text-on-surface-variant lg:col-span-1 lg:col-start-2 lg:max-w-3xl">
              {profile.bio}
            </p>
          )}
          {profile.tags.length > 0 && (
            <div className="col-span-2 flex flex-wrap items-center gap-1.5 pt-1 lg:col-span-1 lg:col-start-2 lg:mt-space-sm lg:gap-space-xs lg:pt-0">
              {profile.tags.map((t) => (
                <Link
                  key={t}
                  href={`/stacks?tags=${encodeURIComponent(t)}`}
                  className="rounded-full bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary hover:bg-surface-container lg:bg-surface-container lg:hover:bg-surface-container-high"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* サマリー（SP） */}
      <section className="mt-3 px-gutter-mobile lg:hidden" aria-label="月額のサマリー">
        <div className="flex flex-col gap-3.5 rounded-xl bg-gradient-to-br from-surface-container to-surface-container-low p-space-md shadow-sm">
          <div className="flex items-center gap-1.5">
            <Icon name="payments" className="text-[18px] text-primary" />
            <span className="font-label-sm text-label-sm font-bold tracking-wider text-outline uppercase">Total Monthly Budget</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="flex items-baseline gap-1">
              <span className="num font-price-xl text-price-xl font-extrabold tracking-tight text-primary">¥{yen(stack.monthlyTotal)}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">/ 月</span>
            </p>
            <p className="flex flex-col items-end">
              <span className="font-label-sm text-label-sm text-outline">年間換算</span>
              <span className="num font-price-md text-price-md font-semibold text-on-surface">¥{yen(stack.monthlyTotal * 12)}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex flex-col rounded-lg bg-surface-container-lowest p-2.5 shadow-sm">
              <span className="font-label-sm text-label-sm text-outline">契約中サブスク</span>
              <span className="mt-0.5 flex items-center gap-1">
                <span className="num font-headline-sm text-headline-sm font-bold text-on-surface">{stack.active.length} 件</span>
                <span className="font-label-sm text-label-sm text-secondary">契約中</span>
              </span>
            </div>
            <div className="flex flex-col rounded-lg bg-surface-container-lowest p-2.5 shadow-sm">
              <span className="font-label-sm text-label-sm text-outline">解約したサブスク</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1">
                {stack.cancelled.length > 0 ? (
                  <>
                    <span className="num font-headline-sm text-headline-sm font-bold text-error">{stack.cancelled.length} 件解約</span>
                    <span className="num font-label-sm text-label-sm text-outline">(-¥{yen(cancelledTotal)})</span>
                  </>
                ) : (
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">なし</span>
                )}
              </span>
            </div>
          </div>
          {shares.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface">カテゴリ別支出内訳</span>
              <ShareTrack shares={shares} />
              <ul className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                {shares.map((s, i) => (
                  <li key={s.category.id} className="flex items-center gap-1">
                    <span className={`size-2 rounded-full ${shareColor(i)}`} aria-hidden />
                    <span>
                      {s.category.name} {percent(s.ratio)}
                      {i === 0 && <span className="num"> (¥{yen(s.amount)})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* サマリー（PC） */}
      <section className="mb-space-lg hidden grid-cols-12 gap-gutter lg:grid" aria-label="月額のサマリー">
        <div className="col-span-7 flex flex-col justify-between rounded-xl bg-surface-container-lowest p-space-lg shadow-md">
          <div>
            <span className="mb-space-xs block font-label-sm text-label-sm tracking-wider text-outline uppercase">Total Monthly Budget</span>
            <p className="mb-space-sm flex items-baseline gap-space-xs">
              <span className="num font-display-hero text-display-hero text-on-surface">¥ {yen(stack.monthlyTotal)}</span>
              <span className="font-headline-md text-headline-md text-on-surface-variant">/ 月</span>
            </p>
          </div>
          <div className="mt-space-sm grid grid-cols-2 gap-space-md rounded-lg bg-surface-container-low p-space-md">
            <div>
              <span className="block font-label-sm text-label-sm text-outline">年間換算コスト</span>
              <span className="num mt-0.5 block font-price-xl text-price-xl text-primary">¥ {yen(stack.monthlyTotal * 12)}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">月額 × 12か月で計算</span>
            </div>
            <div>
              <span className="block font-label-sm text-label-sm text-outline">契約ステータス</span>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-space-xs">
                <span className="num font-price-xl text-price-xl text-on-surface">{stack.active.length}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">件 契約中</span>
                <span className="font-label-md text-label-md text-outline">/ {stack.cancelled.length}件 解約</span>
              </div>
              {stack.cancelled.length > 0 && (
                <span className="num font-body-sm text-body-sm text-tertiary">解約したサブスク 計¥{yen(cancelledTotal)}/月</span>
              )}
            </div>
          </div>
        </div>
        <div className="col-span-5 flex flex-col rounded-xl bg-surface-container-lowest p-space-lg shadow-md">
          <div className="mb-space-sm flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">カテゴリ別支出内訳</h2>
            <span className="font-label-sm text-label-sm text-outline">割合 (金額)</span>
          </div>
          {shares.length > 0 ? (
            <>
              <div className="mb-space-md">
                <ShareTrack shares={shares} />
              </div>
              <ul className="space-y-space-xs">
                {shares.map((s, i) => (
                  <li key={s.category.id} className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-container-low">
                    <span className="flex items-center gap-space-xs">
                      <span className={`inline-block size-3 rounded-full ${shareColor(i)}`} aria-hidden />
                      <span className="font-headline-sm text-headline-sm text-on-surface">{s.category.name}</span>
                    </span>
                    <span className="text-right">
                      <span className="num font-headline-sm text-headline-sm text-on-surface">{percent(s.ratio)}</span>
                      <span className="num ml-1.5 font-label-md text-label-md text-on-surface-variant">(¥{yen(s.amount)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">契約中のサブスクがありません。</p>
          )}
        </div>
      </section>

      {/* 契約中 */}
      <section className="mt-5 lg:mt-0 lg:mb-space-xl" aria-labelledby="active-heading">
        <div className="mb-2 flex items-center justify-between px-gutter-mobile lg:mb-space-md lg:px-0">
          <div className="flex items-center gap-2 lg:gap-space-xs">
            <Icon name="layers" className="text-[20px] text-primary lg:hidden" />
            <Icon name="verified_user" className="hidden text-[24px] text-primary lg:inline-block" />
            <h2 id="active-heading" className="font-headline-sm text-headline-sm font-bold text-on-surface lg:font-headline-lg lg:text-headline-lg">
              契約中サブスク<span className="hidden lg:inline">一覧</span>
            </h2>
            <span className="num rounded-full bg-primary-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-primary lg:bg-primary-fixed lg:px-space-xs lg:font-label-md lg:text-label-md lg:text-on-primary-fixed-variant dark:text-on-primary-container">
              {stack.active.length}件
            </span>
          </div>
          {hasComments && <span className="hidden font-body-sm text-body-sm text-outline lg:inline-block">本人のリアルな使い分けコメント付き</span>}
        </div>
        {stack.active.length === 0 ? (
          <p className="mx-gutter-mobile rounded-xl bg-surface-container-lowest p-space-md font-body-md text-body-md text-on-surface-variant shadow-sm lg:mx-0">
            契約中のサブスクはまだありません。
          </p>
        ) : (
          <div className="flex flex-col gap-3 px-gutter-mobile lg:gap-space-md lg:px-0">
            {stack.active.map((e) => (
              <ActiveSubscriptionCard key={e.sub.id} entry={e} from={from} />
            ))}
          </div>
        )}
      </section>

      {/* 解約済み */}
      {stack.cancelled.length > 0 && (
        <section className="mt-5 px-gutter-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-labelledby="cancelled-heading">
          <div className="mb-space-md hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-space-xs">
              <Icon name="cancel" className="text-[24px] text-outline" />
              <h2 id="cancelled-heading" className="font-headline-lg text-headline-lg text-outline">
                解約したサブスク（見直し履歴）
              </h2>
              <span className="num rounded-full bg-surface-container px-space-xs py-0.5 font-label-md text-label-md font-bold text-outline">
                {stack.cancelled.length}件
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-outline">解約した理由と乗り換え先</span>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-space-md shadow-sm lg:gap-space-md lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2">
                <Icon name="cancel_schedule_send" className="text-[20px] text-outline" />
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface">解約したサブスク (見直し履歴)</p>
              </div>
              <span className="num rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface-variant">
                {stack.cancelled.length}件
              </span>
            </div>
            {stack.cancelled.map((e) => (
              <CancelledSubscriptionItem key={e.sub.id} entry={e} />
            ))}
          </div>
        </section>
      )}

      {/* OGP プレビュー＋登録CTA */}
      <section className="mt-5 px-gutter-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-label="自分の構成を登録する">
        <SharePreviewCta stack={stack} />
      </section>

      {similar.length > 0 && (
        <section className="mt-6 px-gutter-mobile lg:mt-0 lg:mb-space-xl lg:px-0" aria-labelledby="similar-heading">
          <div className="mb-3 flex items-center justify-between lg:mb-space-md">
            <div className="flex items-center gap-1.5">
              <Icon name="group" className="text-[20px] text-primary lg:hidden" />
              <div>
                <h2 id="similar-heading" className="font-headline-sm text-headline-sm font-bold text-on-surface lg:font-headline-lg lg:text-headline-lg">
                  似た構成の人
                </h2>
                <p className="hidden font-body-sm text-body-sm text-on-surface-variant lg:block">契約中のサービスがよく重なっている人</p>
              </div>
            </div>
            <Link
              href="/stacks"
              className="flex items-center gap-0.5 font-label-md text-label-md font-semibold text-primary hover:underline lg:gap-1 lg:font-headline-sm lg:text-headline-sm"
            >
              <span>すべて見る</span>
              <Icon name="arrow_forward" className="text-[16px] lg:hidden" />
              <Icon name="chevron_right" className="hidden text-[16px] lg:inline-block" />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-3 lg:gap-gutter">
            {similar.map((s) => (
              <SimilarStackItem key={s.profile.id} stack={s} />
            ))}
          </div>
        </section>
      )}

      <p className="mx-gutter-mobile mt-6 mb-2 text-center font-body-sm text-body-sm leading-relaxed text-outline lg:mx-0 lg:mt-0">
        ※ 月額は本人の申告値です。{priceDate && `プランの参考価格は${yearMonth(priceDate.slice(0, 7))}時点。`}
        「PR」が付いたリンクはアフィリエイトリンクです。
      </p>
    </div>
  );
}
