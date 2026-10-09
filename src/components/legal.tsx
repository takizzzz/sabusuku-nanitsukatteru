import Link from "next/link";
import { BackButton } from "@/components/legal/back-button";
import { LEGAL_VERSION, OPERATOR } from "@/lib/site-info";

const TABS = [
  { href: "/terms", label: "利用規約", icon: "gavel" },
  { href: "/privacy", label: "プライバシー", icon: "privacy_tip" },
  { href: "/about", label: "運営者情報", icon: "badge" },
  { href: "/ads", label: "広告・PR", icon: "campaign" },
] as const;

function contactHref(contact: string) {
  return contact.includes("@") && !contact.startsWith("http") ? `mailto:${contact}` : contact;
}

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
    <div id="legal-top" className="mx-auto w-full max-w-3xl pb-space-xl md:pt-space-lg">
      <div className="px-margin-mobile pt-space-md pb-space-sm">
        <nav
          aria-label="規約・ポリシー"
          className="bg-surface-container-high p-1 rounded-full flex items-center gap-1 overflow-x-auto no-scrollbar shadow-sm md:w-fit md:mx-auto"
        >
          {TABS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={current === href ? "page" : undefined}
              className={`flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 min-h-10 rounded-full font-label-md text-label-md whitespace-nowrap transition-all duration-200 ${
                current === href ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden>
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-space-md px-margin-mobile">
        <header className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-xl shadow-sm flex flex-col gap-space-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                LEGAL_VERSION.draft ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" : "bg-surface-container-high text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]" aria-hidden>
                history_edu
              </span>
              {LEGAL_VERSION.draft ? "草案（公開前に確定）" : "制定日"}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">制定：{LEGAL_VERSION.date}</span>
          </div>
          <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface mt-1">{title}</h1>
          {intro && <div className="font-body-sm text-body-sm md:text-body-md text-on-surface-variant leading-relaxed">{intro}</div>}
        </header>

        {children}
      </div>

      <div className="mt-space-lg px-margin-mobile flex flex-col items-center gap-space-md">
        <div className="w-full bg-surface-container-low p-space-md rounded-xl flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-start gap-space-xs min-w-0 flex-1">
            <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden>
              help_outline
            </span>
            <p className="font-body-sm text-body-sm text-on-surface font-semibold">
              ご不明な点は運営者までお問い合わせください（連絡先：{OPERATOR.contact ?? <Placeholder />}）。
            </p>
          </div>
          {OPERATOR.contact && (
            <a
              href={contactHref(OPERATOR.contact)}
              className="bg-primary text-on-primary font-label-md text-label-md px-3 py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity flex-shrink-0"
            >
              問い合わせる
            </a>
          )}
        </div>
        <div className="flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm">
          <a href="#legal-top" className="flex items-center gap-1 min-h-10 hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]" aria-hidden>
              arrow_upward
            </span>
            ページ上部へ
          </a>
          <span aria-hidden>•</span>
          <BackButton className="flex items-center gap-1 min-h-10 hover:text-on-surface">
            <span className="material-symbols-outlined text-[16px]" aria-hidden>
              arrow_back
            </span>
            前の画面に戻る
          </BackButton>
        </div>
      </div>
    </div>
  );
}

/** 番号付きの条文カード */
export function Article({ n, title, children }: { n?: number; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-xl shadow-sm flex flex-col gap-space-xs">
      <div className="flex items-start gap-2">
        {n !== undefined && (
          <span className="num w-6 h-6 mt-px rounded-lg bg-surface-container-high text-primary flex flex-shrink-0 items-center justify-center font-label-md text-label-md font-bold">
            {n}
          </span>
        )}
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
      </div>
      <div
        className={`font-body-md text-body-md text-on-surface-variant leading-relaxed flex flex-col gap-2 ${n !== undefined ? "pl-8" : ""} [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ul]:font-body-sm [&_ul]:text-body-sm [&_a]:font-bold [&_a]:text-primary [&_a]:underline`}
      >
        {children}
      </div>
    </section>
  );
}

export function Placeholder() {
  return <span className="rounded bg-tertiary-fixed px-1.5 font-bold text-on-tertiary-fixed-variant">公開前に記入</span>;
}
