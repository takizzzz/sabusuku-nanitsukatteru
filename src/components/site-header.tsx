import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { HeaderAccount } from "./header-account";
import { SITE_NAME } from "@/lib/format";

const nav = [
  { href: "/stacks", label: "構成を探す" },
  { href: "/services", label: "サービス" },
  { href: "/ranking", label: "ランキング" },
  { href: "/compare", label: "比較" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-extrabold whitespace-nowrap text-accent-strong">
          <span className="text-[15px] md:text-lg">{SITE_NAME}</span>
          <span className="rounded bg-accent-soft px-1.5 py-px text-[10px] font-bold">Beta</span>
        </Link>
        <nav className="ml-4 hidden gap-1 md:flex" aria-label="メイン">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-muted hover:bg-surface-2 hover:text-fg">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form action="/stacks" className="hidden xl:block" role="search">
            <label className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <Search className="size-4 text-subtle" aria-hidden />
              <span className="sr-only">構成を検索</span>
              <input name="q" placeholder="サービス名・職種で検索" className="w-44 bg-transparent outline-none placeholder:text-subtle" />
            </label>
          </form>
          <Link href="/stacks" className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 xl:hidden" aria-label="検索">
            <Search className="size-5" />
          </Link>
          <HeaderAccount />
          <Link href="/welcome" className="hidden items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-bold whitespace-nowrap text-on-accent hover:bg-accent-strong md:flex">
            <Plus className="size-4" aria-hidden />
            構成を登録する
          </Link>
        </div>
      </div>
    </header>
  );
}
