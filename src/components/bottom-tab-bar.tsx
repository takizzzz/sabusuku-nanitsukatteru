"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Plus, Trophy, UserRound } from "lucide-react";

const tabs = [
  { href: "/", label: "ホーム", icon: House },
  { href: "/stacks", label: "探す", icon: Compass },
  { href: "/welcome", label: "登録", icon: Plus, primary: true },
  { href: "/ranking", label: "ランキング", icon: Trophy },
  { href: "/me", label: "マイページ", icon: UserRound },
];

/** スマートフォン用の下部タブバー（要件定義書 5章） */
export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="タブ"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2">
        {tabs.map(({ href, label, icon: Icon, primary }) => {
          const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
          if (primary) {
            return (
              <li key={href}>
                <Link href={href} aria-label="構成を登録する" className="-mt-4 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg">
                  <Icon className="size-7" />
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${current ? "text-accent-strong" : "text-subtle"}`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
