import Link from "next/link";
import { SITE_NAME } from "@/lib/format";

const groups = [
  {
    title: "探す",
    links: [
      { href: "/stacks", label: "構成を探す" },
      { href: "/stacks?sort=new", label: "新着の構成" },
      { href: "/services", label: "サービス一覧" },
      { href: "/ranking", label: "ランキング" },
    ],
  },
  {
    title: "このサイトについて",
    links: [
      { href: "/about", label: "運営者情報" },
      { href: "/ads", label: "広告・アフィリエイトについて" },
      { href: "/terms", label: "利用規約" },
      { href: "/privacy", label: "プライバシーポリシー" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-extrabold text-accent-strong">{SITE_NAME}</p>
          <p className="mt-2 text-sm text-muted">みんなのサブスクの使い分けとリアルな月額が見える共有サービス。</p>
          <p className="mt-3 text-xs text-subtle">
            一部のリンクはアフィリエイトリンクで「PR」と表示しています。ランキングや統計の順位は広告の有無で変えません。
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-sm font-bold">{g.title}</p>
            <ul className="mt-2 space-y-1">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-1 text-sm text-muted hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-subtle">© 2026 {SITE_NAME}</p>
    </footer>
  );
}
