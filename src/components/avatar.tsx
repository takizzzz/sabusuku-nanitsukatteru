import type { Profile } from "@/lib/types";

/** 頭文字アバターの配色（デザインのトークン。ダークモードでも自動で切り替わる） */
const palette = [
  "bg-primary-fixed text-on-primary-fixed",
  "bg-tertiary-fixed text-on-tertiary-fixed",
  "bg-secondary-fixed text-on-secondary-fixed",
  "bg-surface-container-highest text-primary",
  "bg-primary-container text-white",
  "bg-tertiary-container text-on-tertiary",
];

const sizes = {
  xs: "size-7 text-label-sm",
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-20 text-3xl",
} as const;

export function Avatar({
  profile,
  size = "md",
  className = "",
}: {
  profile: Pick<Profile, "handle" | "displayName" | "avatarUrl">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const cls = sizes[size];
  if (profile.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatarUrl} alt="" className={`${cls} shrink-0 rounded-full bg-surface-container object-cover ${className}`} />;
  }
  const color = palette[[...profile.handle].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      aria-hidden
      className={`${cls} ${color} inline-flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
    >
      {[...(profile.displayName || profile.handle)][0]?.toUpperCase()}
    </span>
  );
}
