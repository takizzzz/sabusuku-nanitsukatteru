"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "トップ" },
  { href: "/stacks", label: "構成を探す" },
  { href: "/services", label: "サービス一覧" },
  { href: "/ranking", label: "ランキング" },
  { href: "/compare", label: "比較" },
];

/** PC ヘッダーのナビゲーション（現在地をハイライト） */
export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-space-xs xl:flex" aria-label="メイン">
      {nav.map((n) => {
        const current = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={current ? "page" : undefined}
            className={`rounded-lg px-space-sm py-1.5 font-headline-sm text-headline-sm whitespace-nowrap transition-colors ${
              current
                ? "bg-surface-container-high text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
