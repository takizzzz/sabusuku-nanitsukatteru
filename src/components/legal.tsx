import Link from "next/link";
import { FileText, Info, Megaphone, ShieldCheck } from "lucide-react";
import { LEGAL_VERSION, OPERATOR } from "@/lib/site-info";

const TABS = [
  { href: "/terms", label: "利用規約", icon: FileText },
  { href: "/privacy", label: "プライバシー", icon: ShieldCheck },
  { href: "/about", label: "運営者情報", icon: Info },
  { href: "/ads", label: "広告・PR", icon: Megaphone },
] as const;

/** S-14 静的ページの共通枠 */
export function LegalPage({
  current,
  title,
  intro,
  children,
}: {
  current: (typeof TABS)[number]["href"];
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:py-10">
      <nav aria-label="規約・ポリシー" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={current === href ? "page" : undefined}
            className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${current === href ? "bg-accent text-on-accent" : "bg-surface-3 text-muted hover:text-fg"}`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <header className="rounded-2xl border border-line bg-card p-5">
        <p className="flex flex-wrap items-center gap-2 text-xs text-subtle">
          {LEGAL_VERSION.draft && <span className="rounded bg-pr-soft px-2 py-0.5 font-bold text-pr">草案（公開前に確定）</span>}
          <span>制定：{LEGAL_VERSION.date}</span>
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">{title}</h1>
        {intro && <div className="mt-2 text-sm text-muted">{intro}</div>}
      </header>
      <div className="space-y-3">{children}</div>
      <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">
        ご不明な点は運営者までお問い合わせください（連絡先：{OPERATOR.contact ?? "公開前に記入"}）。
      </p>
    </div>
  );
}

/** 番号付きの条文カード */
export function Article({ n, title, children }: { n?: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="flex items-start gap-3 font-extrabold">
        {n !== undefined && (
          <span className="num flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-sm text-accent-strong">{n}</span>
        )}
        <span className="pt-0.5">{title}</span>
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-7 text-muted [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function Placeholder() {
  return <span className="rounded bg-pr-soft px-1.5 font-bold text-pr">公開前に記入</span>;
}
