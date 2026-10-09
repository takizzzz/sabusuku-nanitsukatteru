import Link from "next/link";

/** 用途タグ（#つき）。tone="muted" は控えめな灰色 */
export function Tag({ name, href, tone = "primary" }: { name: string; href?: string; tone?: "primary" | "muted" }) {
  const cls = `font-label-sm text-label-sm ${tone === "muted" ? "text-outline" : "text-primary"}`;
  return href ? (
    <Link href={href} className={`${cls} hover:underline`}>
      #{name}
    </Link>
  ) : (
    <span className={cls}>#{name}</span>
  );
}
