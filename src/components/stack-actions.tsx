"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, PencilLine } from "lucide-react";
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

  if (me === targetUserId) {
    return (
      <Link href="/me" className="flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-bold text-on-accent hover:bg-accent-strong">
        <PencilLine className="size-4" aria-hidden />
        編集する
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-end">
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
        className={`flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold ${liked ? "border-like bg-like text-white" : "border-line text-like hover:border-like"}`}
      >
        <Heart className={`size-4 ${liked ? "fill-current" : ""}`} aria-hidden />
        <span className="num">{count}</span>
      </button>
      {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
