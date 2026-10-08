import Link from "next/link";
import type { ServiceStat } from "@/lib/stacks";
import { percent, yen } from "@/lib/format";
import { ServiceLogo } from "./service-logo";

/** サービスカード（「モノ」のカード）の行表示。ランキングやトップで使う */
export function ServiceRow({ stat, rank }: { stat: ServiceStat; rank?: number }) {
  const { service, representativePlan: plan } = stat;
  return (
    <Link
      href={`/services/${service.slug}`}
      className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-container-low"
    >
      {rank !== undefined && (
        <span
          className={`num w-6 shrink-0 text-center font-price-lg text-price-lg ${rank <= 3 ? "text-primary" : "text-outline"}`}
        >
          {rank}
        </span>
      )}
      <ServiceLogo service={service} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-headline-sm text-headline-sm text-on-surface">
          {service.name}
          {service.company && (
            <span className="ml-1.5 font-label-sm text-label-sm font-medium text-outline">{service.company}</span>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 font-body-sm text-body-sm text-on-surface-variant">
          <span>{stat.category.name}</span>
          <span className="num">
            {stat.activeUsers}人（{percent(stat.usageRate)}）
          </span>
          {stat.avgSatisfaction !== null ? (
            <span className="num inline-flex items-center gap-0.5 font-semibold text-amber-600 dark:text-amber-400">
              <span aria-hidden className="material-symbols-outlined fill text-[14px]">
                star
              </span>
              <span className="sr-only">平均満足度</span>
              {stat.avgSatisfaction.toFixed(1)}
            </span>
          ) : (
            <span className="text-outline">満足度はデータ不足</span>
          )}
        </p>
      </div>
      {plan && (
        <div className="shrink-0 text-right">
          <p className="font-label-sm text-label-sm text-outline">{plan.name}</p>
          <p className="num font-price-md text-price-md text-on-surface">
            ¥{yen(plan.billingCycle === "yearly" ? Math.round(plan.price / 12) : plan.price)}
            <span className="ml-0.5 font-label-sm text-label-sm text-outline">/月</span>
          </p>
        </div>
      )}
    </Link>
  );
}
