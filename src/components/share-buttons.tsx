"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * X・LINE 共有、URLコピー、三点メニュー（通報）。
 * variant="bar" は構成詳細（S-03）用：スマホでは白い丸ピル、PC では角丸ボタンになる。
 */
export function ShareButtons({
  url,
  text,
  reportHref,
  variant = "default",
}: {
  url: string;
  text: string;
  reportHref?: string;
  variant?: "default" | "bar";
}) {
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const x = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const line = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);

  const bar = variant === "bar";
  const base = bar
    ? "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 min-h-8 font-label-md text-label-md shadow-sm transition-colors lg:rounded-lg lg:px-space-sm lg:py-2 lg:min-h-10 lg:font-headline-sm lg:text-headline-sm lg:shadow-none"
    : "flex min-h-10 items-center gap-1 rounded-lg px-space-sm py-2 font-headline-sm text-headline-sm transition-colors";
  const plain = bar
    ? `${base} bg-surface-container-lowest text-on-surface hover:bg-surface-container lg:bg-surface-container-high lg:hover:bg-surface-variant`
    : `${base} bg-surface-container-high text-on-surface hover:bg-surface-variant`;
  const xCls = bar
    ? `${base} bg-surface-container-lowest text-on-surface hover:bg-surface-container lg:bg-inverse-surface lg:text-inverse-on-surface lg:px-space-md lg:hover:opacity-90`
    : `${base} bg-inverse-surface px-space-md text-inverse-on-surface hover:opacity-90`;

  return (
    <div className={bar ? "contents" : "flex flex-wrap items-center gap-2"}>
      <a href={x} target="_blank" rel="noopener" className={xCls}>
        <svg aria-hidden className="size-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        {bar ? (
          <>
            <span className="lg:hidden">ポスト</span>
            <span className="hidden lg:inline">シェア</span>
          </>
        ) : (
          <span>ポスト</span>
        )}
      </a>
      <a href={line} target="_blank" rel="noopener" className={plain}>
        <span aria-hidden className={`material-symbols-outlined text-[16px] text-secondary ${bar ? "lg:text-[18px] lg:text-on-surface" : ""}`}>
          chat_bubble
        </span>
        <span>LINE</span>
      </a>
      <button
        type="button"
        className={plain}
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        <span aria-hidden className={`material-symbols-outlined text-[16px] text-primary ${bar ? "lg:text-[18px] lg:text-on-surface" : ""}`}>
          {copied ? "check" : "link"}
        </span>
        <span aria-live="polite">{copied ? "コピーしました" : "URLコピー"}</span>
      </button>
      {reportHref && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="その他の操作"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
            className={
              bar
                ? "flex size-8 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant shadow-sm hover:text-on-surface lg:size-10 lg:rounded-lg lg:bg-surface-container-high lg:shadow-none lg:hover:bg-surface-variant"
                : "flex size-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
            }
          >
            <span aria-hidden className="material-symbols-outlined text-[18px] lg:text-[20px]">
              more_vert
            </span>
          </button>
          {menu && (
            <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg bg-surface-container-lowest p-1 shadow-lg ring-1 ring-outline-variant/40">
              <Link href={reportHref} className="flex min-h-11 items-center gap-2 rounded-md px-3 font-label-md text-label-md text-on-surface hover:bg-surface-container-low">
                <span aria-hidden className="material-symbols-outlined text-[18px] text-error">
                  flag
                </span>
                通報する
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
