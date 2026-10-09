"use client";

import { useRouter } from "next/navigation";

/** 前の画面に戻る。履歴がなければトップへ */
export function BackButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}>
      {children}
    </button>
  );
}
