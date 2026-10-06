import type { Service } from "@/lib/types";

const sizes = {
  sm: "size-6 text-[10px] rounded-md",
  md: "size-9 text-xs rounded-lg",
  lg: "size-12 text-sm rounded-xl",
} as const;

/**
 * サービスのロゴ。ロゴの使用条件が確認できるまでは頭文字＋ブランド色で表示する
 * （要件定義書 9章：使用条件が不明なものはテキスト表示）。
 */
export function ServiceLogo({
  service,
  size = "md",
}: {
  service: Pick<Service, "name" | "brandColor" | "logoUrl">;
  size?: keyof typeof sizes;
}) {
  if (service.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={service.logoUrl} alt="" className={`${sizes[size]} object-contain`} />;
  }
  const initials = service.name
    .replace(/[^A-Za-z0-9ぁ-んァ-ヶ一-龠+]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center font-bold text-white ring-1 ring-white/20`}
      style={{ background: service.brandColor ?? "#4f46e5" }}
    >
      {initials}
    </span>
  );
}
