/** 満足度（1〜5の整数）を星5つで表示する */
export function Stars({ value, size = "md", className = "" }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const px = { sm: "text-[14px]", md: "text-[16px]", lg: "text-[18px]" }[size];
  const n = Math.round(value);
  return (
    <span className={`inline-flex items-center text-amber-500 dark:text-amber-400 ${className}`} role="img" aria-label={`満足度 ${n} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden className={`material-symbols-outlined ${px} ${i <= n ? "fill" : "opacity-60"}`}>
          star
        </span>
      ))}
    </span>
  );
}
