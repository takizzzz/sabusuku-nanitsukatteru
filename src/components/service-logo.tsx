import type { Service } from "@/lib/types";

const sizes = {
  xs: "size-4 text-[8px] rounded",
  sm: "size-6 text-[10px] rounded-md",
  md: "size-10 text-xs rounded-lg",
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
    return <img src={service.logoUrl} alt="" className={`${sizes[size]} shrink-0 bg-surface-container object-contain`} />;
  }
  const initials = service.name
    .replace(/[^A-Za-z0-9ぁ-んァ-ヶ一-龠+]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, size === "xs" ? 1 : 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  // ブランド色は登録データの値。無いときはトークンのプライマリ色
  return (
    <span
      aria-hidden
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center leading-none font-bold text-white ${service.brandColor ? "" : "bg-primary-container"}`}
      style={service.brandColor ? { background: service.brandColor } : undefined}
    >
      {initials}
    </span>
  );
}
