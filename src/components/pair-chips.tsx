import Link from "next/link";
import { pairSlug } from "@/lib/stacks";
import type { Service } from "@/lib/types";
import { ServiceLogo } from "./service-logo";

/** 併用ペアへのリンク（S-06 下部「他の定番併用ペア」と比較の入口） */
export function PairChips({ pairs }: { pairs: { a: Service; b: Service; users: number }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {pairs.map((x) => (
        <li key={`${x.a.id}${x.b.id}`} className="max-w-full">
          <Link
            href={`/compare/${pairSlug(x.a, x.b)}`}
            className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-2 text-on-surface shadow-sm transition-all hover:text-primary active:scale-95"
          >
            <span className="flex shrink-0 -space-x-1.5" aria-hidden>
              <ServiceLogo service={x.a} size="sm" />
              <ServiceLogo service={x.b} size="sm" />
            </span>
            <span className="truncate font-label-md text-label-md">
              {x.a.name} × {x.b.name}
            </span>
            <span className="num shrink-0 font-label-sm text-label-sm text-outline">{x.users}人</span>
            <span aria-hidden className="material-symbols-outlined shrink-0 text-[14px] text-on-surface-variant">
              chevron_right
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
