import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Section({
  title,
  more,
  children,
  className = "",
}: {
  title: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-6xl px-4 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-xl font-extrabold md:text-2xl">{title}</h2>
        {more && (
          <Link href={more.href} className="flex items-center text-sm font-bold text-accent-strong hover:underline">
            {more.label}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
