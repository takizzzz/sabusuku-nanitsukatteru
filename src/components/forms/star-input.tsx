"use client";

/** 満足度の入力（★1〜5の整数）。同じ★をもう一度押すと未選択に戻る */
export function StarInput({
  value,
  onChange,
  name,
  label = "満足度",
  boxed,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  name?: string;
  label?: string;
  /** 入力欄と同じ高さの面に入れる（S-11） */
  boxed?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex items-center text-amber-500 dark:text-amber-400 ${boxed ? "min-h-11 rounded-xl bg-surface-container-low px-1" : ""}`}
    >
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {[1, 2, 3, 4, 5].map((i) => {
        const on = value !== null && i <= value;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`★${i}`}
            onClick={() => onChange(value === i ? null : i)}
            className="flex size-8 items-center justify-center rounded-lg transition-transform hover:scale-110 hover:bg-surface-container"
          >
            <span className={`material-symbols-outlined text-[22px] ${on ? "fill" : "text-outline-variant"}`} aria-hidden>
              star
            </span>
          </button>
        );
      })}
      <span className="num ml-1 w-8 font-headline-sm text-headline-sm font-bold text-on-surface">{value ? `${value}.0` : "—"}</span>
    </div>
  );
}
