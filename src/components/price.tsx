import { yen } from "@/lib/format";

const sizes = {
  sm: { num: "text-base", unit: "text-[11px]" },
  md: { num: "text-xl", unit: "text-xs" },
  lg: { num: "text-3xl", unit: "text-sm" },
  xl: { num: "text-5xl", unit: "text-lg" },
} as const;

/** 月額表示。「¥」と「/月」を小さく、数字を大きく太く（デザイン指針） */
export function Price({
  value,
  size = "md",
  unit = "/月",
  className = "",
}: {
  value: number;
  size?: keyof typeof sizes;
  unit?: string | null;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span className={`num inline-flex items-baseline gap-0.5 font-extrabold ${className}`}>
      <span className={`${s.unit} font-bold`}>¥</span>
      <span className={s.num}>{yen(value)}</span>
      {unit && <span className={`${s.unit} ml-0.5 font-semibold text-subtle`}>{unit}</span>}
    </span>
  );
}
