import Link from "next/link";
import { LogoMark } from "./logo-mark";
import { SITE_NAME } from "@/lib/format";

const groups = [
  {
    title: "探す",
    links: [
      { href: "/", label: "トップ" },
      { href: "/stacks", label: "人気の構成" },
      { href: "/stacks?sort=new", label: "新着の構成" },
      { href: "/services", label: "サービス一覧" },
      { href: "/ranking", label: "ランキング" },
      { href: "/compare", label: "併用比較" },
    ],
  },
  {
    title: "このサイトについて",
    links: [
      { href: "/about", label: "運営者情報" },
      { href: "/ads", label: "広告・アフィリエイトについて（PR表記）" },
      { href: "/terms", label: "利用規約" },
      { href: "/privacy", label: "プライバシーポリシー" },
      { href: "/services/request", label: "サービス追加の申請" },
    ],
  },
];

/** SP で横並びに出す主なリンク */
const spLinks = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/ads", label: "広告について" },
  { href: "/about", label: "運営者情報" },
  { href: "/services/request", label: "サービス追加の申請" },
];

export function SiteFooter() {
  return (
    <footer className="mt-space-xl w-full bg-surface-container-low md:border-t md:border-outline-variant/30">
      {/* SP（s01） */}
      <div className="flex flex-col gap-space-md px-margin-mobile pt-space-lg pb-28 md:hidden">
        <div className="flex items-center gap-space-xs">
          <LogoMark className="size-6" />
          <span className="font-headline-sm text-headline-sm text-on-surface">{SITE_NAME}</span>
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          みんなのサブスクの使い分けとリアルな月額が見える共有サービス。一部のリンクはアフィリエイトリンクで「PR」と表示しています。ランキングや統計の順位は広告の有無で変えません。
        </p>
        <ul className="flex flex-wrap gap-x-space-md gap-y-space-xs pt-space-xs font-label-md text-label-md text-on-surface-variant">
          {spLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-block py-1 transition-colors hover:text-primary">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="pt-space-xs font-label-sm text-label-sm font-normal text-on-surface-variant/80">© 2026 {SITE_NAME}</p>
      </div>

      {/* PC（s02-explore-pc） */}
      <div className="mx-auto hidden max-w-7xl px-margin py-space-xl md:block">
        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-5 space-y-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-md text-headline-md tracking-tight text-primary">{SITE_NAME}</span>
              <span className="rounded-full bg-primary-fixed px-space-xs py-0.5 font-label-sm text-label-sm text-on-primary-fixed-variant">Beta</span>
            </div>
            <p className="max-w-sm font-body-md text-body-md text-on-surface-variant">みんなのサブスクの使い分けとリアルな月額が見える共有サービス</p>
            <p className="pt-space-xs font-label-sm text-label-sm font-normal text-outline">
              一部のリンクはアフィリエイトリンクで「PR」と表示しています。ランキングや統計の順位は広告の有無で変えません。
            </p>
          </div>
          {groups.map((g, i) => (
            <div key={g.title} className={`${i === 0 ? "col-span-3" : "col-span-4"} space-y-space-sm`}>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">{g.title}</h3>
              <ul className="space-y-space-xs font-body-sm text-body-sm">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-on-surface-variant transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-space-xl flex items-center justify-between gap-space-sm border-t border-outline-variant/30 pt-space-md font-label-sm text-label-sm font-normal text-on-surface-variant">
          <span>© 2026 {SITE_NAME}</span>
          <span className="text-outline">Real subscription stacks, transparent budgets.</span>
        </div>
      </div>
    </footer>
  );
}
