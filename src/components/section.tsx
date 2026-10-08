import Link from "next/link";

/** トップなどの見出しつきセクション。icon には絵文字や小さな要素を渡せる */
export function Section({
  title,
  more,
  icon,
  aside,
  children,
  className = "",
  id,
}: {
  title: string;
  more?: { href: string; label: string };
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`mx-auto flex w-full max-w-7xl flex-col gap-space-sm px-margin-mobile md:gap-space-md md:px-margin ${className}`}>
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-lg leading-none md:text-xl" aria-hidden>{icon}</span>}
          <h2 className="font-headline-md text-headline-md text-on-surface md:text-[24px] md:leading-8">{title}</h2>
        </div>
        {aside}
        {more && (
          <Link href={more.href} className="flex shrink-0 items-center gap-0.5 font-label-md text-label-md font-bold text-primary hover:underline">
            <span>{more.label}</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden>chevron_right</span>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
