"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Ellipsis, Flag, Link as LinkIcon } from "lucide-react";

/** X・LINE 共有、URLコピー、三点メニュー（通報） */
export function ShareButtons({ url, text, reportHref }: { url: string; text: string; reportHref: string }) {
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false);
  const x = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const line = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
  const base = "flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-bold";
  const btn = `${base} border-line bg-surface hover:border-accent`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={x} target="_blank" rel="noopener" className={`${base} border-fg bg-fg text-bg hover:opacity-90`}>
        𝕏 <span>ポスト</span>
      </a>
      <a href={line} target="_blank" rel="noopener" className={btn}>
        LINE
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <LinkIcon className="size-4" aria-hidden />}
        {copied ? "コピーしました" : "URLコピー"}
      </button>
      <div className="relative">
        <button
          type="button"
          aria-label="その他の操作"
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
          className="flex size-11 items-center justify-center rounded-lg border border-line bg-surface hover:border-accent"
        >
          <Ellipsis className="size-4" />
        </button>
        {menu && (
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-line bg-surface p-1 shadow-lg">
            <Link href={reportHref} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-surface-2">
              <Flag className="size-4" aria-hidden />
              通報する
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
