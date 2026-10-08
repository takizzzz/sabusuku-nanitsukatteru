import Link from "next/link";
import { AffiliateLink, isAffiliate } from "@/components/affiliate-link";
import { ServiceLogo } from "@/components/service-logo";
import { Stars } from "@/components/stars";
import { yen, yearMonth } from "@/lib/format";
import type { StackEntry } from "@/lib/stacks";

function planLabel(e: StackEntry): string | null {
  if (!e.plan) return null;
  return `${e.plan.name}プラン（${e.plan.billingCycle === "yearly" ? "年額" : "月額"}）`;
}

/** 契約中サブスク1件（S-03）。スマホはデザインの SP 版、lg 以上は PC 版の並び */
export function ActiveSubscriptionCard({ entry: e, from }: { entry: StackEntry; from: string }) {
  const yearly = e.plan?.billingCycle === "yearly";
  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm transition-all lg:gap-space-md lg:p-space-lg lg:shadow-md lg:hover:shadow-xl">
      <div className="flex items-start justify-between gap-2.5 lg:gap-space-md">
        <div className="flex min-w-0 items-center gap-3 lg:items-start lg:gap-space-md">
          <span className="shrink-0 rounded-xl shadow-sm">
            <ServiceLogo service={e.service} size="lg" />
          </span>
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 lg:gap-space-xs">
              <h3 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface lg:font-headline-md lg:text-headline-md">
                <Link href={`/services/${e.service.slug}`} className="hover:underline">
                  {e.service.name}
                </Link>
              </h3>
              {e.service.company && (
                <span className="rounded bg-surface-container px-1.5 font-label-sm text-label-sm text-outline lg:bg-transparent lg:px-0 lg:font-body-sm lg:text-body-sm lg:text-on-surface-variant">
                  {e.service.company}
                </span>
              )}
              {e.plan && (
                <span className="hidden rounded bg-surface-container px-space-xs py-0.5 font-label-sm text-label-sm text-on-surface lg:inline">
                  {e.plan.name}プラン
                </span>
              )}
            </div>
            {planLabel(e) && <span className="font-label-sm text-label-sm text-on-surface-variant lg:hidden">{planLabel(e)}</span>}
            {/* PC：星1つ＋数値＋タグ */}
            <div className="mt-1 hidden flex-wrap items-center gap-space-sm lg:flex">
              {e.sub.satisfaction !== null && (
                <span className="flex items-center gap-0.5 font-headline-sm text-headline-sm text-amber-500 dark:text-amber-400">
                  <span aria-hidden className="material-symbols-outlined fill text-[18px]">
                    star
                  </span>
                  <span className="num">{e.sub.satisfaction}</span>
                  <span className="ml-1 font-label-sm text-label-sm text-outline">満足度</span>
                </span>
              )}
              {e.sub.tags.length > 0 && (
                <span className="flex flex-wrap items-center gap-space-xs">
                  {e.sub.tags.map((t) => (
                    <span key={t} className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-primary">
                      #{t}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-space-xs">
          <div className="text-right">
            <p className="flex items-baseline justify-end gap-0.5">
              <span className="num font-price-lg text-price-lg font-extrabold text-on-surface lg:font-price-xl lg:text-price-xl">
                ¥{yen(e.sub.monthlyPrice)}
              </span>
              <span className="font-label-sm text-label-sm text-outline lg:hidden">/月</span>
            </p>
            <p className="font-label-sm text-label-sm text-outline lg:font-body-sm lg:text-body-sm lg:text-on-surface-variant">
              <span className="hidden lg:inline">/ 月</span>
              {yearly && <span className="lg:ml-1">（年額を月割り）</span>}
            </p>
          </div>
          <span className="hidden lg:block">
            <AffiliateLink
              service={e.service}
              from={from}
              label="公式サイトを見る"
              variant={isAffiliate(e.service) ? "primary" : "secondary"}
            />
          </span>
        </div>
      </div>

      {/* SP：星5つ＋タグ */}
      {(e.sub.satisfaction !== null || e.sub.tags.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 lg:hidden">
          {e.sub.satisfaction !== null ? (
            <span className="flex items-center gap-1">
              <Stars value={e.sub.satisfaction} />
              <span className="num font-label-md text-label-md font-bold text-on-surface">{e.sub.satisfaction}</span>
              <span className="font-label-sm text-label-sm text-outline">満足度</span>
            </span>
          ) : (
            <span />
          )}
          {e.sub.tags.length > 0 && (
            <span className="flex flex-wrap items-center gap-1">
              {e.sub.tags.map((t) => (
                <span key={t} className="rounded-md bg-surface-container-low px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                  #{t}
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {e.sub.comment && (
        <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-2.5 lg:gap-0 lg:p-space-md">
          <div className="flex items-center justify-between gap-2 lg:mb-1">
            <span className="flex items-center gap-1 text-primary lg:gap-space-xs lg:text-on-surface-variant">
              <span aria-hidden className="material-symbols-outlined text-[15px] lg:text-[16px] lg:text-primary">
                chat_bubble
              </span>
              <span className="font-label-sm text-label-sm font-bold">使い分けコメント</span>
            </span>
            <span className="flex items-center gap-2 font-label-sm text-label-sm font-medium text-outline">
              {e.sub.startedOn && <span>{yearMonth(e.sub.startedOn)}から利用</span>}
              <Link href={`/report?type=comment&id=${e.sub.id}`} className="hover:text-error hover:underline">
                通報
              </Link>
            </span>
          </div>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface">{e.sub.comment}</p>
        </div>
      )}

      <div className="flex items-center justify-end pt-1 lg:hidden">
        <AffiliateLink service={e.service} from={from} label="公式サイトを見る" variant="soft" />
      </div>
    </article>
  );
}

/** 解約したサブスク1件（S-03 見直し履歴） */
export function CancelledSubscriptionItem({ entry: e }: { entry: StackEntry }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-surface-container-lowest p-3 shadow-sm lg:gap-space-sm lg:rounded-xl lg:bg-surface-container-low/60 lg:p-space-lg lg:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-2 lg:gap-space-md">
        <div className="flex min-w-0 items-center gap-2.5 opacity-80 lg:items-start lg:gap-space-md">
          <span className="shrink-0 opacity-60 grayscale">
            <ServiceLogo service={e.service} size="md" />
          </span>
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-1.5 lg:gap-space-xs">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface line-through decoration-outline lg:font-headline-md lg:text-headline-md lg:text-on-surface-variant">
                {e.service.name}
              </span>
              {e.plan && <span className="hidden font-body-sm text-body-sm text-outline lg:inline">{e.plan.name}プラン</span>}
              {e.sub.cancelledOn && (
                <span className="rounded bg-surface-container-high px-1.5 font-label-sm text-label-sm text-outline lg:bg-surface-container lg:px-space-xs lg:py-0.5">
                  {yearMonth(e.sub.cancelledOn)} 解約
                </span>
              )}
            </div>
            <span className="font-label-sm text-label-sm text-outline lg:mt-0.5 lg:font-body-sm lg:text-body-sm">
              解約時月額: ¥{yen(e.sub.monthlyPrice)} / 月
            </span>
          </div>
        </div>
        {e.switchedTo && (
          <Link
            href={`/services/${e.switchedTo.slug}`}
            className="flex shrink-0 items-center gap-1 rounded bg-secondary-fixed px-2 py-1 font-label-sm text-label-sm font-semibold text-on-secondary-fixed-variant hover:opacity-90 lg:gap-1.5 lg:rounded-full lg:bg-surface-container-high lg:px-space-md lg:py-1.5 lg:font-label-md lg:text-label-md lg:text-on-surface"
          >
            <span className="lg:text-outline">乗り換え先:</span>
            <span className="lg:font-bold lg:text-primary">{e.switchedTo.name}</span>
            <span aria-hidden className="material-symbols-outlined text-[14px] lg:text-[16px] lg:text-primary">
              arrow_forward
            </span>
          </Link>
        )}
      </div>
      {(e.sub.cancelReason || e.sub.cancelReasonDetail) && (
        <div className="rounded bg-surface-container-low p-2 lg:rounded-lg lg:bg-surface-container-lowest/80 lg:p-space-md">
          <p className="mb-1 hidden items-center gap-space-xs font-label-sm text-label-sm text-outline lg:flex">
            <span aria-hidden className="material-symbols-outlined text-[16px]">
              info
            </span>
            <span className="font-bold">解約の理由・経緯</span>
          </p>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            {e.sub.cancelReason && <span className="mr-2 font-bold text-on-surface">{e.sub.cancelReason}</span>}
            {e.sub.cancelReasonDetail}
          </p>
        </div>
      )}
    </div>
  );
}
