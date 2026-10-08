import { Star } from "lucide-react";

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`満足度 ${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-3.5 ${i <= value ? "fill-current" : "opacity-30"}`} aria-hidden />
      ))}
    </span>
  );
}
