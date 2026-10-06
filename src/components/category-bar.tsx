import type { CategoryShare } from "@/lib/stacks";
import { percent, yen } from "@/lib/format";

export const CATEGORY_COLORS: Record<string, string> = {
  ai: "#4f46e5",
  video: "#e11d48",
  music: "#059669",
  work: "#0891b2",
  learning: "#d97706",
  other: "#78716c",
};

/** カテゴリ別の内訳（積み上げバー＋凡例） */
export function CategoryBar({ shares }: { shares: CategoryShare[] }) {
  if (shares.length === 0) return null;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label="カテゴリ別の内訳">
        {shares.map((s) => (
          <span key={s.category.id} style={{ width: `${s.ratio * 100}%`, background: CATEGORY_COLORS[s.category.slug] ?? "#888" }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {shares.map((s) => (
          <li key={s.category.id} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: CATEGORY_COLORS[s.category.slug] ?? "#888" }} aria-hidden />
            <span className="flex-1 font-semibold">{s.category.name}</span>
            <span className="num font-bold">{percent(s.ratio)}</span>
            <span className="num w-20 text-right text-xs text-subtle">¥{yen(s.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
