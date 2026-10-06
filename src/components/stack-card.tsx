import Link from "next/link";
import { Heart } from "lucide-react";
import type { Stack } from "@/lib/stacks";
import { relativeDay } from "@/lib/format";
import { Avatar } from "./avatar";
import { Price } from "./price";
import { ServiceLogo } from "./service-logo";
import { Tag } from "./tag";

const MAX_LOGOS = 6;

/** 構成カード（「人」のカード）。要件定義書 6章 S-01 の共通部品 */
export function StackCard({ stack, showComment = true }: { stack: Stack; showComment?: boolean }) {
  const { profile, active } = stack;
  const shown = active.slice(0, MAX_LOGOS);
  const rest = active.length - shown.length;
  const comment = active.find((e) => e.sub.comment)?.sub.comment;
  const tags = [...new Set([...profile.tags, ...active.flatMap((e) => e.sub.tags)])].slice(0, 3);

  return (
    <Link
      href={`/@${profile.handle}`}
      className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-accent hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar profile={profile} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">@{profile.handle}</p>
          <p className="truncate text-xs text-subtle">
            {[profile.occupation, profile.ageRange].filter(Boolean).join("・")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold text-subtle">月額合計</p>
          <Price value={stack.monthlyTotal} size="md" />
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-1.5" aria-label="契約中のサービス">
        {shown.map((e) => (
          <li key={e.sub.id} className="flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pr-2 pl-0.5">
            <ServiceLogo service={e.service} size="sm" />
            <span className="text-xs font-medium">{e.service.name}</span>
          </li>
        ))}
        {rest > 0 && <li className="text-xs font-semibold text-subtle">+{rest}</li>}
      </ul>

      {showComment && comment && (
        <p className="line-clamp-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">「{comment}」</p>
      )}

      <div className="mt-auto flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-x-2">
          {tags.map((t) => (
            <Tag key={t} name={t} />
          ))}
        </div>
        <span className="text-xs text-subtle">{relativeDay(profile.updatedAt)}</span>
        <span className="flex items-center gap-0.5 text-xs text-like" aria-label={`いいね ${stack.likeCount}件`}>
          <Heart className="size-3.5" aria-hidden />
          {stack.likeCount}
        </span>
      </div>
    </Link>
  );
}
