"use client";

import Link from "next/link";
import { useSessionUserId } from "./use-session";

function PersonCircle() {
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-primary">
      <span className="material-symbols-outlined text-[18px] text-on-primary" aria-hidden>
        person
      </span>
    </span>
  );
}

/** ヘッダー右端：未ログインなら「ログイン」、ログイン中ならマイページへのアイコン */
export function HeaderAccount() {
  const userId = useSessionUserId();
  if (userId) {
    return (
      <Link href="/me" aria-label="マイページ" className="flex size-11 items-center justify-center rounded-full hover:opacity-90 md:order-last">
        <PersonCircle />
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/login"
        className="hidden px-space-md py-2 font-headline-sm text-headline-sm whitespace-nowrap text-on-surface-variant transition-colors hover:text-on-surface md:inline-flex"
      >
        ログイン
      </Link>
      <Link href="/login" aria-label="ログイン" className="flex size-11 items-center justify-center rounded-full md:hidden">
        <PersonCircle />
      </Link>
    </>
  );
}
