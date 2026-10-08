import Link from "next/link";
import { Star } from "lucide-react";
import type { ServiceStat } from "@/lib/stacks";
import { percent } from "@/lib/format";
import { Price } from "./price";
import { ServiceLogo } from "./service-logo";

/** サービスカード（「モノ」のカード）の行表示。ランキングやトップで使う */
export function ServiceRow({ stat, rank }: { stat: ServiceStat; rank?: number }) {
  const { service, representativePlan: plan } = stat;
  return (
    <Link
      href={`/services/${service.slug}`}
      className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-surface-2"
    >
      {rank !== undefined && (
        <span className={`num w-6 text-center text-lg font-extrabold ${rank <= 3 ? "text-accent-strong" : "text-subtle"}`}>
          {rank}
        </span>
      )}
      <ServiceLogo service={service} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">
          {service.name}
          <span className="ml-1.5 text-[11px] font-medium text-subtle">{service.company}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <span>{stat.category.name}</span>
          <span className="num">
            {stat.activeUsers}人（{percent(stat.usageRate)}）
          </span>
          {stat.avgSatisfaction !== null ? (
            <span className="num inline-flex items-center gap-0.5 font-semibold text-amber-600">
              <Star className="size-3 fill-current" aria-hidden />
              <span className="sr-only">平均満足度</span>
              {stat.avgSatisfaction.toFixed(1)}
            </span>
          ) : (
            <span className="text-subtle">満足度はデータ不足</span>
          )}
        </p>
      </div>
      {plan && (
        <div className="text-right">
          <p className="text-[10px] text-subtle">{plan.name}</p>
          <Price
            value={plan.billingCycle === "yearly" ? Math.round(plan.price / 12) : plan.price}
            size="sm"
          />
        </div>
      )}
    </Link>
  );
}
