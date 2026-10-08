import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ServiceLogo } from "@/components/service-logo";
import { SITE_NAME, yen } from "@/lib/format";
import type { Stack } from "@/lib/stacks";

/** Avatar の大きさをデザインに合わせて上書きする（Avatar は sm/md/lg しか持たないため） */
export function SizedAvatar({ stack, className }: { stack: Stack; className: string }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full shadow-sm ${className}`}>
      <Avatar profile={stack.profile} size="md" />
    </span>
  );
}

/** OGP カードのプレビュー＋登録 CTA（S-03） */
export function SharePreviewCta({ stack }: { stack: Stack }) {
  const { profile } = stack;
  const names = stack.active.map((e) => e.service.name);
  const shown = names.slice(0, 3);
  const rest = names.length - shown.length;
  return (
    <>
      {/* SP */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-inverse-surface via-primary-container to-primary p-space-md text-on-primary shadow-lg lg:hidden dark:from-surface-container-high dark:via-primary-container dark:to-primary-container dark:text-on-primary-container">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-sm text-label-sm font-bold tracking-wider text-surface-variant uppercase dark:text-on-primary-container/80">
            SNS Share Card Preview
          </span>
          <span className="shrink-0 rounded-full bg-on-primary/20 px-2 py-0.5 font-label-sm text-label-sm dark:bg-on-primary-container/20">OGP 自動生成</span>
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl bg-surface-container-lowest/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <SizedAvatar stack={stack} className="*:size-8! *:text-sm!" />
            <span className="truncate font-label-md text-label-md font-bold">{profile.displayName} のサブスク構成</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="num font-price-xl text-price-xl font-extrabold text-secondary-container dark:text-secondary">
              ¥{yen(stack.monthlyTotal)}
            </span>
            <span className="font-label-sm text-label-sm text-surface-variant dark:text-on-primary-container/80">
              / 月（{stack.active.length}件）
            </span>
          </div>
          {shown.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {shown.map((n) => (
                <span key={n} className="rounded bg-surface-container-lowest/20 px-2 py-1 font-label-sm text-label-sm">
                  {n}
                </span>
              ))}
              {rest > 0 && <span className="rounded bg-surface-container-lowest/20 px-2 py-1 font-label-sm text-label-sm">+{rest}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-headline-sm text-headline-sm font-bold">あなたも自分のサブスク構成を公開してみませんか？</h2>
          <p className="font-body-md text-body-md leading-relaxed text-surface-variant dark:text-on-primary-container/80">
            サービスを選んで月額を入れるだけ。こんなカードが自動でできて、そのままシェアできます。
          </p>
        </div>
        <Link
          href="/welcome"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-container-lowest px-4 py-3.5 font-headline-sm text-headline-sm font-bold text-primary shadow-md transition-all hover:bg-surface-container active:scale-[0.98]"
        >
          <span aria-hidden className="material-symbols-outlined text-[22px]">
            add_circle
          </span>
          <span>自分の構成を登録する（無料）</span>
        </Link>
      </div>

      {/* PC */}
      <div className="hidden rounded-xl bg-surface-container-high p-space-lg lg:block">
        <div className="grid grid-cols-12 items-center gap-gutter">
          <div className="col-span-7">
            <span className="mb-space-xs block font-label-sm text-label-sm tracking-wider text-outline uppercase">この構成のOGP画像（SNSプレビュー）</span>
            <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container p-space-lg shadow-xl">
              <div className="mb-space-md flex items-center gap-space-xs">
                <span className="size-3 rounded-full bg-primary" />
                <span className="font-headline-sm text-headline-sm tracking-tight text-primary">{SITE_NAME}</span>
              </div>
              <div className="mb-space-md flex items-center gap-space-md">
                <SizedAvatar stack={stack} className="*:size-12! *:text-lg!" />
                <div className="min-w-0">
                  <span className="block truncate font-headline-md text-headline-md text-on-surface">{profile.displayName} のサブスク</span>
                  {profile.occupation && <span className="font-body-sm text-body-sm text-on-surface-variant">{profile.occupation}</span>}
                </div>
              </div>
              <div className="flex items-end justify-between gap-space-md pt-space-sm">
                <div>
                  <span className="block font-label-sm text-label-sm text-outline">月額合計</span>
                  <span className="num font-display-hero text-display-hero text-on-surface">¥{yen(stack.monthlyTotal)}</span>
                </div>
                <div className="flex -space-x-2 pb-2">
                  {stack.active.slice(0, 3).map((e) => (
                    <span key={e.sub.id} className="rounded-full shadow ring-2 ring-surface-container-lowest *:size-8! *:rounded-full!">
                      <ServiceLogo service={e.service} size="md" />
                    </span>
                  ))}
                  {stack.active.length > 3 && (
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface shadow ring-2 ring-surface-container-lowest">
                      +{stack.active.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-5 flex flex-col justify-center space-y-space-md pl-space-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">あなたも自分のサブスク構成を公開してみませんか？</h2>
              <p className="mt-space-xs font-body-md text-body-md leading-relaxed text-on-surface-variant">
                サービスを選んで月額を入れるだけ。こんなカードが自動でできて、そのままシェアできます。
              </p>
            </div>
            <div>
              <Link
                href="/welcome"
                className="inline-flex items-center justify-center gap-space-xs rounded-lg bg-primary-container px-space-lg py-3 font-headline-sm text-headline-sm text-on-primary shadow-md transition-opacity hover:opacity-90 dark:text-on-primary-container"
              >
                <span aria-hidden className="material-symbols-outlined text-[20px]">
                  add_circle
                </span>
                <span>自分の構成を登録する（無料）</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** 似た構成の人1件。SP は横長の行、PC はカード */
export function SimilarStackItem({ stack }: { stack: Stack }) {
  const { profile } = stack;
  const names = stack.active.map((e) => e.service.name);
  const shown = names.slice(0, 3);
  const rest = names.length - shown.length;
  return (
    <Link
      href={`/@${profile.handle}`}
      className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-3.5 shadow-sm transition-shadow hover:shadow-md lg:flex-col lg:items-stretch lg:justify-between lg:gap-0 lg:p-space-lg lg:shadow-md lg:hover:shadow-xl"
    >
      {/* SP */}
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <SizedAvatar stack={stack} className="*:size-10! *:text-base!" />
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">{profile.displayName}</span>
            {profile.occupation && (
              <span className="shrink-0 truncate rounded bg-surface-container px-1.5 font-label-sm text-label-sm text-outline">{profile.occupation}</span>
            )}
          </div>
          <span className="truncate font-label-sm text-label-sm text-on-surface-variant">{shown.join("・")}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end lg:hidden">
        <span className="num font-price-md text-price-md font-bold text-primary">¥{yen(stack.monthlyTotal)}</span>
        <span className="font-label-sm text-label-sm text-outline">/月</span>
      </div>

      {/* PC */}
      <div className="hidden lg:block">
        <div className="mb-space-sm flex items-center gap-space-sm">
          <SizedAvatar stack={stack} className="*:size-11! *:text-base!" />
          <div className="min-w-0">
            <span className="block truncate font-headline-sm text-headline-sm text-on-surface">{profile.displayName}</span>
            {profile.occupation && <span className="font-label-sm text-label-sm text-on-surface-variant">{profile.occupation}</span>}
          </div>
        </div>
        <div className="mb-space-sm flex items-baseline justify-between">
          <span className="font-label-sm text-label-sm text-outline">月額合計</span>
          <span className="num font-price-xl text-price-xl text-on-surface">
            ¥{yen(stack.monthlyTotal)}
            <span className="font-label-md text-label-md font-normal text-on-surface-variant">/月</span>
          </span>
        </div>
        <div className="mb-space-md flex flex-wrap items-center gap-1.5">
          {shown.map((n) => (
            <span key={n} className="rounded bg-surface-container-high px-2 py-1 font-label-sm text-label-sm text-on-surface">
              {n}
            </span>
          ))}
          {rest > 0 && <span className="rounded bg-surface-container px-1.5 py-1 font-label-sm text-label-sm text-outline">+{rest}</span>}
        </div>
        {profile.bio && <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{profile.bio}</p>}
      </div>
      <div className="mt-space-md hidden items-center justify-between pt-space-xs font-label-sm text-label-sm text-on-surface-variant lg:flex">
        <span className="truncate text-primary">{profile.tags[0] ? `#${profile.tags[0]}` : ""}</span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="material-symbols-outlined text-[16px] text-tertiary">
            favorite
          </span>
          <span className="num">{stack.likeCount}</span>
          <span className="sr-only">いいね</span>
        </span>
      </div>
    </Link>
  );
}
