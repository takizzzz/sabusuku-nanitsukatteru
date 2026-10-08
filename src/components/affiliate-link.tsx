import { ExternalLink } from "lucide-react";
import type { Service } from "@/lib/types";

/**
 * 公式サイトへのリンク。アフィリエイト案件があるときだけ「PR」を付け、
 * クリックを計測するため /go/[slug] を経由する（要件定義書 8章）。
 */
export function AffiliateLink({
  service,
  from,
  variant = "primary",
  label = "公式サイトへ",
}: {
  service: Service;
  from: string;
  variant?: "primary" | "secondary";
  label?: string;
}) {
  if (!service.officialUrl && !service.affiliateUrl) return null;
  const isPr = service.affiliateActive && Boolean(service.affiliateUrl);
  const cls =
    variant === "primary"
      ? "bg-accent text-on-accent hover:bg-accent-strong"
      : "border border-line bg-card text-fg hover:border-accent";
  return (
    <a
      href={`/go/${service.slug}?from=${encodeURIComponent(from)}`}
      target="_blank"
      rel={isPr ? "sponsored noopener" : "noopener"}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold ${cls}`}
    >
      {label}
      <ExternalLink className="size-3.5" aria-hidden />
      {isPr && (
        <span className="ml-1 rounded bg-pr-soft px-1 py-px text-[10px] font-extrabold text-pr" title="広告（アフィリエイトリンク）">
          PR
        </span>
      )}
    </a>
  );
}
