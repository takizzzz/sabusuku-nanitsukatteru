"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useSessionUserId } from "./use-session";

/** ヘッダー右端：未ログインなら「ログイン」、ログイン中ならマイページへのアイコン */
export function HeaderAccount() {
  const userId = useSessionUserId();
  if (userId) {
    return (
      <Link href="/me" aria-label="マイページ" className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong hover:opacity-90">
        <UserRound className="size-5" />
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-muted hover:bg-surface-2 md:block">
        ログイン
      </Link>
      <Link href="/login" className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2 md:hidden" aria-label="ログイン">
        <UserRound className="size-5" />
      </Link>
    </>
  );
}
