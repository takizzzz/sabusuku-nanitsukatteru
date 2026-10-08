import Link from "next/link";
import type { Stack } from "@/lib/stacks";
import { relativeDay, yen } from "@/lib/format";
import { Avatar } from "./avatar";
import { ServiceLogo } from "./service-logo";
import { Tag } from "./tag";

const MAX_SERVICES = 4;

function cardData(stack: Stack) {
  const { profile, active } = stack;
  return {
    profile,
    shown: active.slice(0, MAX_SERVICES),
    rest: Math.max(0, active.length - MAX_SERVICES),
    comment: active.find((e) => e.sub.comment)?.sub.comment ?? null,
    tags: [...new Set([...profile.tags, ...active.flatMap((e) => e.sub.tags)])].slice(0, 3),
    meta: [profile.occupation, profile.ageRange].filter(Boolean).join("・"),
  };
}

function Heart({ count, className = "" }: { count: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`いいね ${count}件`}>
      <span className="material-symbols-outlined fill text-[16px] text-tertiary" aria-hidden>
        favorite
      </span>
      <span className="num">{count}</span>
    </span>
  );
}

/**
 * 構成カード（「人」のカード）。要件定義書 6章 S-01 の共通部品。
 * variant="feed" はトップの人気フィード用（s01）、既定は「構成を探す」用（s02 SP/PC）。
 */
export function StackCard({
  stack,
  showComment = true,
  variant = "default",
}: {
  stack: Stack;
  showComment?: boolean;
  variant?: "default" | "feed";
}) {
  return variant === "feed" ? (
    <FeedCard stack={stack} showComment={showComment} />
  ) : (
    <ExploreCard stack={stack} showComment={showComment} />
  );
}

function ExploreCard({ stack, showComment }: { stack: Stack; showComment: boolean }) {
  const { profile, shown, rest, comment, tags, meta } = cardData(stack);
  const updated = relativeDay(profile.updatedAt);
  return (
    <Link
      href={`/@${profile.handle}`}
      className="group flex min-w-0 flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.99] md:justify-between md:gap-0 md:rounded-xl md:p-space-lg"
    >
      <div className="flex flex-col gap-3 md:gap-space-md">
        {/* 見出し行 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 md:gap-space-sm">
            <Avatar profile={profile} size="md" className="max-md:size-10" />
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface transition-colors group-hover:text-primary">
                  @{profile.handle}
                </h3>
                <span className="shrink-0 text-[11px] text-outline md:hidden">・{updated}</span>
              </div>
              <span className="truncate font-body-sm text-body-sm text-on-surface-variant md:font-label-sm md:text-label-sm md:font-normal">
                {meta}
              </span>
            </div>
          </div>
          {/* SP：いいね数 */}
          <Heart
            count={stack.likeCount}
            className="shrink-0 rounded-full bg-surface-container px-2 py-1 font-label-sm text-label-sm text-tertiary md:hidden"
          />
          {/* PC：月額合計 */}
          <div className="hidden shrink-0 text-right md:block">
            <span className="block font-label-sm text-label-sm font-normal text-outline">月額合計</span>
            <span className="num font-price-xl text-price-xl text-on-surface">
              ¥{yen(stack.monthlyTotal)}
              <span className="font-body-sm text-body-sm text-on-surface-variant">/月</span>
            </span>
          </div>
        </div>

        {/* SP：月額合計 */}
        <div className="flex items-baseline justify-between rounded-xl bg-surface-container-low px-3 py-1.5 md:hidden">
          <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">サブスク月額合計</span>
          <div className="flex items-baseline gap-1">
            <span className="num font-price-xl text-price-xl font-extrabold tracking-tight text-on-surface">
              ¥{yen(stack.monthlyTotal)}
            </span>
            <span className="font-label-sm text-label-sm font-normal text-outline">/月</span>
          </div>
        </div>

        {/* 契約中のサービス */}
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="契約中のサービス">
          {shown.map((e) => (
            <li
              key={e.sub.id}
              className="inline-flex items-center gap-1 rounded-lg bg-surface-container-high px-2.5 py-1 font-label-sm text-[12px] font-semibold text-on-surface md:rounded md:px-2 md:text-label-sm"
            >
              <span
                aria-hidden
                className={`size-2 rounded-full md:hidden ${e.service.brandColor ? "" : "bg-primary"}`}
                style={e.service.brandColor ? { background: e.service.brandColor } : undefined}
              />
              {e.service.name}
            </li>
          ))}
          {rest > 0 && (
            <li className="rounded-lg bg-surface-container px-2 py-1 font-label-sm text-[11px] font-bold text-on-surface-variant md:rounded md:text-label-sm md:font-normal">
              +{rest}件
            </li>
          )}
        </ul>

        {showComment && comment && (
          <p className="line-clamp-2 border-l-2 border-primary/20 pl-3 font-body-sm text-body-sm leading-relaxed text-on-surface-variant md:line-clamp-3 md:rounded-lg md:border-0 md:bg-surface-container-low md:p-space-sm">
            「{comment}」
          </p>
        )}

        {/* PC：タグ */}
        {tags.length > 0 && (
          <div className="hidden flex-wrap items-center gap-1.5 md:flex">
            {tags.map((t, i) => (
              <Tag key={t} name={t} tone={i < 2 ? "primary" : "muted"} />
            ))}
          </div>
        )}
      </div>

      {/* SP：フッター */}
      <div className="flex items-center justify-between gap-2 border-t border-surface-container/50 pt-1 md:hidden">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="text-[11px] text-outline">
              #{t}
            </span>
          ))}
        </div>
        <DetailLink className="font-label-sm text-label-sm font-bold" />
      </div>

      {/* PC：フッター */}
      <div className="mt-space-md hidden items-center justify-between pt-space-md md:flex">
        <div className="flex items-center gap-space-sm text-on-surface-variant">
          <span className="font-label-sm text-label-sm font-normal">{updated} 更新</span>
          <Heart count={stack.likeCount} className="font-label-md text-label-md font-normal" />
        </div>
        <DetailLink className="font-headline-sm text-headline-sm" />
      </div>
    </Link>
  );
}

function DetailLink({ className }: { className: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 text-primary group-hover:underline ${className}`}>
      <span>構成詳細</span>
      <span className="material-symbols-outlined text-[16px]" aria-hidden>
        arrow_forward
      </span>
    </span>
  );
}

/** トップの「人気の構成」カード（s01） */
function FeedCard({ stack, showComment }: { stack: Stack; showComment: boolean }) {
  const { profile, comment, tags } = cardData(stack);
  const shown = stack.active.slice(0, 3);
  const rest = stack.active.length - shown.length;
  const cancelled = stack.cancelled.slice(0, 1);
  return (
    <Link
      href={`/@${profile.handle}`}
      className="group flex min-w-0 flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-shadow hover:shadow-md active:shadow-md"
    >
      <div className="flex items-start justify-between gap-space-xs">
        <div className="flex min-w-0 items-center gap-space-xs">
          <Avatar profile={profile} size="md" />
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="max-w-[65%] shrink-0 truncate font-headline-sm text-headline-sm text-on-surface group-hover:text-primary">@{profile.handle}</span>
              {profile.occupation && (
                <span className="min-w-0 truncate rounded bg-surface-container-high px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                  {profile.occupation}
                </span>
              )}
            </div>
            {profile.ageRange && <span className="font-body-sm text-body-sm text-outline">{profile.ageRange}</span>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="num font-price-xl text-price-xl tracking-tight text-on-surface">¥{yen(stack.monthlyTotal)}</span>
          <div className="font-label-sm text-label-sm leading-tight font-normal text-outline">
            {stack.active.length}契約中{stack.cancelled.length > 0 && ` / ${stack.cancelled.length}解約`}
          </div>
        </div>
      </div>

      <ul className="scrollbar-none relative flex items-center gap-1.5 overflow-x-auto py-1" aria-label="契約中のサービス">
        {shown.map((e) => (
          <li key={e.sub.id} className="flex shrink-0 items-center gap-1 rounded-md bg-surface-container-low px-2 py-1">
            <ServiceLogo service={e.service} size="xs" />
            <span className="font-label-sm text-label-sm font-semibold text-on-surface">{e.service.name}</span>
          </li>
        ))}
        {rest > 0 && <li className="shrink-0 px-1 font-label-sm text-label-sm text-outline">+{rest}</li>}
        {cancelled.map((e) => (
          <li key={e.sub.id} className="flex shrink-0 items-center rounded-md bg-surface-container-low px-2 py-1 opacity-60">
            <span className="font-label-sm text-label-sm font-medium text-outline line-through">
              <span className="sr-only">解約済み：</span>
              {e.service.name}
            </span>
          </li>
        ))}
      </ul>

      {showComment && comment && (
        <div className="rounded-lg bg-surface-container-low/70 p-2.5">
          <p className="line-clamp-3 font-body-md text-body-md leading-snug text-on-surface">「{comment}」</p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {tags.slice(0, 2).map((t) => (
            <Tag key={t} name={t} />
          ))}
        </div>
        <Heart
          count={stack.likeCount}
          className="shrink-0 rounded-full bg-surface-container-low px-2.5 py-1 font-label-md text-label-md font-bold text-tertiary"
        />
      </div>
    </Link>
  );
}
