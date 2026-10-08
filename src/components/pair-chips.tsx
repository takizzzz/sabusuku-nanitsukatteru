import Link from "next/link";
import { pairSlug } from "@/lib/stacks";
import type { Service } from "@/lib/types";

export function PairChips({ pairs }: { pairs: { a: Service; b: Service; users: number }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {pairs.map((x) => (
        <li key={`${x.a.id}${x.b.id}`}>
          <Link href={`/compare/${pairSlug(x.a, x.b)}`} className="flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-sm font-bold hover:border-accent">
            {x.a.name} × {x.b.name}
            <span className="num text-xs font-normal text-subtle">{x.users}人</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
