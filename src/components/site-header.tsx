import Link from "next/link";
import { HeaderAccount } from "./header-account";
import { HeaderNav } from "./header-nav";
import { LogoMark } from "./logo-mark";
import { SITE_NAME } from "@/lib/format";

/** サイト共通のヘッダー（SP は s01、PC は s02-explore-pc のデザイン） */
export function SiteHeader() {
  return (
    <header className="pt-safe sticky top-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl md:bg-surface-container-lowest/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-space-sm px-gutter-mobile md:gap-space-md md:px-margin">
        <div className="flex min-w-0 flex-1 items-center gap-space-lg md:flex-none">
          <Link href="/" className="flex min-w-0 items-center gap-space-xs">
            <LogoMark className="size-8 md:hidden" />
            <span className="truncate font-headline-sm text-headline-sm tracking-tight text-on-surface md:font-headline-md md:text-headline-md md:text-primary">
              {SITE_NAME}
            </span>
            <span className="shrink-0 rounded-full bg-primary-container px-1.5 py-0.5 font-label-sm text-label-sm leading-none text-white md:bg-primary-fixed md:px-space-xs md:leading-[14px] md:text-on-primary-fixed-variant">
              Beta
            </span>
          </Link>
          <HeaderNav />
        </div>

        <form action="/stacks" role="search" className="hidden min-w-0 flex-1 md:block md:max-w-md">
          <label className="relative flex items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-space-sm text-[20px] text-on-surface-variant" aria-hidden>
              search
            </span>
            <span className="sr-only">構成を検索</span>
            <input
              name="q"
              placeholder="サービス名・職種・用途で検索..."
              className="h-10 w-full rounded-lg bg-surface-container-low pr-3 pl-10 font-body-sm text-body-sm text-on-surface transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </label>
        </form>

        <div className="flex shrink-0 items-center gap-space-xs md:gap-space-sm">
          <Link
            href="/stacks"
            aria-label="構成を探す"
            className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-primary md:hidden"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden>
              search
            </span>
          </Link>
          <HeaderAccount />
          <Link
            href="/welcome"
            className="hidden items-center justify-center rounded-lg bg-primary-container px-space-md py-2 font-headline-sm text-headline-sm whitespace-nowrap text-white shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-colors hover:bg-primary hover:text-on-primary md:inline-flex"
          >
            + 構成を登録する
          </Link>
        </div>
      </div>
    </header>
  );
}
