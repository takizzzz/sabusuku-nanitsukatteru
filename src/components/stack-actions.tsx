"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/lib/actions/community";
import { useSessionUserId } from "./use-session";

/** いいね（F-13）。本人が見ているときは代わりに「編集する」を出す（S-03） */
export function StackActions({ targetUserId, handle, initialCount }: { targetUserId: string; handle: string; initialCount: number }) {
  const me = useSessionUserId();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!me) return;
    fetch(`/api/likes/${targetUserId}`)
      .then((r) => r.json())
      .then((d: { count: number | null; liked: boolean }) => {
        if (d.count !== null) setCount(d.count);
        setLiked(d.liked);
      })
      .catch(() => {});
  }, [me, targetUserId]);

  const shape =
    "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 min-h-8 font-label-md text-label-md font-bold shadow-sm transition-all active:scale-95 lg:rounded-lg lg:px-space-md lg:py-2 lg:min-h-10 lg:font-headline-sm lg:text-headline-sm lg:shadow-none";

  if (me === targetUserId) {
    return (
      <Link href="/me" className={`${shape} bg-primary-container text-on-primary dark:text-on-primary-container hover:opacity-90`}>
        <span aria-hidden className="material-symbols-outlined text-[18px]">
          edit
        </span>
        編集する
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-pressed={liked}
        aria-label={`いいね（${count}件）`}
        disabled={pending}
        onClick={() => {
          if (!me) {
            router.push(`/login?next=${encodeURIComponent(`/@${handle}`)}`);
            return;
          }
          start(async () => {
            const r = await toggleLike(targetUserId);
            if (r.needLogin) router.push(`/login?next=${encodeURIComponent(`/@${handle}`)}`);
            else if (r.error) setError(r.error);
            else {
              setLiked(Boolean(r.liked));
              setCount(r.count ?? count);
              setError(null);
            }
          });
        }}
        className={`${shape} ${
          liked
            ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
            : "bg-surface-container-lowest text-on-surface hover:text-tertiary lg:bg-surface-container lg:text-tertiary lg:hover:bg-tertiary-fixed"
        }`}
      >
        <span aria-hidden className={`material-symbols-outlined text-[18px] text-tertiary fill`}>
          favorite
        </span>
        <span className="num">{count}</span>
      </button>
      {error && (
        <p className="absolute top-full left-0 z-10 mt-1 w-max max-w-60 rounded bg-error-container px-2 py-1 font-label-sm text-label-sm text-on-error-container" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
