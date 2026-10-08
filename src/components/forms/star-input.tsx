"use client";

import { Star } from "lucide-react";

/** 満足度の入力（★1〜5の整数）。同じ★をもう一度押すと未選択に戻る */
export function StarInput({
  value,
  onChange,
  name,
  label = "満足度",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  name?: string;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`★${i}`}
          onClick={() => onChange(value === i ? null : i)}
          className="flex size-10 items-center justify-center rounded-lg text-amber-500 hover:bg-surface-3"
        >
          <Star className={`size-6 ${value !== null && i <= value ? "fill-current" : "opacity-35"}`} aria-hidden />
        </button>
      ))}
      <span className="num ml-1 w-8 text-sm font-bold">{value ? `${value}.0` : "—"}</span>
    </div>
  );
}
