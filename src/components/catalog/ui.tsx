import type { ReactNode } from "react";
import Link from "next/link";

/** Material Symbols のアイコン（装飾用） */
export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

/** 一覧ページの見出し（バッジ＋タイトル＋説明＋右側の補足）。s02 の見出しに合わせる */
export function PageHeader({
  badge,
  badgeIcon,
  title,
  description,
  aside,
  children,
}: {
  badge: string;
  badgeIcon: string;
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="w-full md:bg-surface-container-low md:py-space-xl">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-margin-mobile pt-3 pb-4 md:gap-space-xs md:px-margin md:py-0">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed">
            <Icon name={badgeIcon} className="text-[14px] md:text-[15px]" />
            <span>{badge}</span>
          </span>
          {aside}
        </div>
        <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface md:font-headline-lg md:text-headline-lg">{title}</h1>
        {description && (
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant md:font-body-md md:text-body-md">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}

/** 件数などの小さなピル（見出しの右側） */
export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant md:bg-surface-container-lowest md:shadow-sm">
      <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
      <span className="font-bold text-on-surface">{children}</span>
    </span>
  );
}

/** セクション見出し（アイコン＋タイトル＋件数＋右の補足） */
export function SectionHead({
  id,
  icon,
  title,
  count,
  note,
  muted = false,
}: {
  id?: string;
  icon: string;
  title: ReactNode;
  count?: ReactNode;
  note?: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="mb-space-sm flex items-center justify-between gap-2 md:mb-space-md">
      <div className="flex min-w-0 items-center gap-1.5 md:gap-space-xs">
        <Icon name={icon} className={`text-[20px] md:text-[22px] ${muted ? "text-outline" : "text-primary"}`} />
        <h2 id={id} className={`font-headline-sm text-headline-sm font-bold md:font-headline-md md:text-headline-md ${muted ? "text-outline" : "text-on-surface"}`}>
          {title}
        </h2>
        {count !== undefined && (
          <span
            className={`num shrink-0 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${
              muted ? "bg-surface-container text-outline" : "bg-primary-fixed text-on-primary-fixed-variant"
            }`}
          >
            {count}
          </span>
        )}
      </div>
      {note && <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{note}</span>}
    </div>
  );
}

/** カード（白地・角丸・薄い影） */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-surface-container-lowest shadow-sm ${className}`}>{children}</div>;
}

/** 横スクロールの絞り込みチップ */
export function ChipNav({
  label,
  items,
  className = "",
}: {
  label: string;
  items: { key: string; label: ReactNode; href: string; current: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-margin-mobile py-0.5 md:flex-wrap md:px-0">
        {items.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              scroll={false}
              aria-current={c.current ? "page" : undefined}
              className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 font-label-md text-label-md whitespace-nowrap shadow-sm transition-colors active:scale-95 ${
                c.current
                  ? "bg-primary-container font-bold text-white"
                  : "bg-surface-container-lowest font-medium text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  ai: "smart_toy",
  video: "movie",
  music: "music_note",
  work: "work",
  learning: "school",
  books: "menu_book",
  news: "newspaper",
  game: "sports_esports",
  dev: "terminal",
  life: "favorite",
};

/** カテゴリのアイコン名 */
export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? "category";
}

/** 割合の横棒 */
export function Bar({ ratio, tone = "primary" }: { ratio: number; tone?: "primary" | "muted" }) {
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-container">
      <div
        className={`h-full rounded-full ${tone === "primary" ? "bg-primary-container dark:bg-primary" : "bg-outline"}`}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}
