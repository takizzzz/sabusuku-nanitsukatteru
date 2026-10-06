import Link from "next/link";

export function Tag({ name, href }: { name: string; href?: string }) {
  const cls = "text-xs font-semibold text-accent-strong";
  return href ? (
    <Link href={href} className={`${cls} hover:underline`}>
      #{name}
    </Link>
  ) : (
    <span className={cls}>#{name}</span>
  );
}
