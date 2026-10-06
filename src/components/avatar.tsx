import type { Profile } from "@/lib/types";

const palette = ["#4f46e5", "#0e7490", "#b6166f", "#15803d", "#b45309", "#7c3aed"];

export function Avatar({
  profile,
  size = "md",
}: {
  profile: Pick<Profile, "handle" | "displayName" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
}) {
  const cls = { sm: "size-8 text-sm", md: "size-11 text-base", lg: "size-20 text-3xl" }[size];
  if (profile.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatarUrl} alt="" className={`${cls} rounded-full object-cover`} />;
  }
  const color = palette[[...profile.handle].reduce((n, c) => n + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      aria-hidden
      className={`${cls} inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ background: color }}
    >
      {[...profile.displayName][0]}
    </span>
  );
}
