import type { Service } from "@/lib/types";

/** アフィリエイト案件が有効か（「PR」表示と rel="sponsored" の判定） */
export function isAffiliate(service: Service): boolean {
  return service.affiliateActive && Boolean(service.affiliateUrl);
}

/**
 * 公式サイトへのリンク。アフィリエイト案件があるときだけ「PR」を付け、
 * クリックを計測するため /go/[slug] を経由する（要件定義書 8章）。
 *  - primary: 塗りのボタン（PC の構成詳細・サービス詳細）
 *  - secondary: 控えめな塗り（PR なしのとき）
 *  - soft: スマホの構成詳細のカード下部
 */
export function AffiliateLink({
  service,
  from,
  variant = "primary",
  label = "公式サイトへ",
  className = "",
}: {
  service: Service;
  from: string;
  variant?: "primary" | "secondary" | "soft";
  label?: string;
  className?: string;
}) {
  if (!service.officialUrl && !service.affiliateUrl) return null;
  const isPr = isAffiliate(service);
  const cls = {
    primary: "bg-primary-container text-on-primary dark:text-on-primary-container hover:opacity-90 font-headline-sm text-headline-sm px-space-md",
    secondary: "bg-surface-container-high text-on-surface hover:bg-surface-variant font-headline-sm text-headline-sm px-space-md",
    soft: "bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md font-bold px-4",
  }[variant];
  const pr = {
    primary: "bg-primary/40 dark:bg-on-primary/40",
    secondary: "bg-surface-container-lowest text-outline",
    soft: "bg-surface-container-lowest text-outline",
  }[variant];
  return (
    <a
      href={`/go/${service.slug}?from=${encodeURIComponent(from)}`}
      target="_blank"
      rel={isPr ? "sponsored noopener" : "noopener"}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg py-1.5 shadow-sm transition-colors ${cls} ${className}`}
    >
      <span>{label}</span>
      <span aria-hidden className="material-symbols-outlined text-[16px]">
        {variant === "soft" ? "open_in_new" : "north_east"}
      </span>
      {isPr && (
        <span className={`ml-0.5 rounded px-1 font-label-sm text-label-sm ${pr}`} title="広告（アフィリエイトリンク）">
          PR
        </span>
      )}
    </a>
  );
}
