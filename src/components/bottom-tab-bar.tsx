"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/stacks", label: "探す", icon: "explore" },
  { href: "/welcome", label: "構成を登録する", icon: "add", primary: true },
  { href: "/ranking", label: "ランキング", icon: "leaderboard" },
  { href: "/me", label: "マイページ", icon: "person" },
];

/** スマートフォン用の下部タブバー（要件定義書 5章 / s01 のデザイン） */
export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="タブ"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 bg-surface/90 shadow-[0_-2px_12px_rgba(15,23,42,0.05)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-center justify-between px-space-xs">
        {tabs.map(({ href, label, icon, primary }) => {
          if (primary) {
            return (
              <li key={href} className="-mt-4 flex h-14 min-w-[56px] flex-1 items-center justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  className="flex size-12 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[28px]" aria-hidden>
                    {icon}
                  </span>
                </Link>
              </li>
            );
          }
          const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex min-w-[56px] flex-1">
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${current ? "text-primary" : "text-on-surface-variant"}`}
              >
                <span className={`material-symbols-outlined text-[24px] ${current ? "fill" : ""}`} aria-hidden>
                  {icon}
                </span>
                <span className="font-label-sm text-label-sm">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
