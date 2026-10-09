"use client";

import { useState } from "react";
import { TAG_MAX } from "@/lib/options";

/** 用途タグ：候補から選ぶ＋自由入力（F-06） */
export function TagInput({
  value,
  onChange,
  suggestions,
  name,
  id,
  boxed,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  name?: string;
  id?: string;
  /** タグ全体を入力欄と同じ面で囲む（S-11） */
  boxed?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const full = value.length >= 10;
  const add = (t: string) => {
    const tag = t.replace(/^#/, "").trim().slice(0, TAG_MAX);
    if (tag && !value.includes(tag) && !full) onChange([...value, tag]);
    setDraft("");
  };
  const rest = [...new Set(suggestions)].filter((s) => !value.includes(s)).slice(0, boxed ? 4 : 6);
  const chip = "inline-flex min-h-8 items-center gap-1 rounded-full px-3 font-label-sm text-label-sm transition-colors";

  return (
    <div className={boxed ? "rounded-xl bg-surface-container-low p-2" : ""}>
      {name && value.map((t) => <input key={t} type="hidden" name={name} value={t} />)}
      <ul className="flex flex-wrap items-center gap-1.5" aria-label="用途タグ">
        {value.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className={`${chip} bg-primary-container font-bold text-on-primary shadow-sm hover:opacity-90 dark:text-on-primary-container`}
              aria-label={`${t} を外す`}
            >
              #{t}
              <span className="material-symbols-outlined text-[14px]" aria-hidden>
                close
              </span>
            </button>
          </li>
        ))}
        {!full &&
          rest.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => add(t)}
                className={`${chip} ${boxed ? "bg-surface-container hover:bg-surface-container-high" : "bg-surface-container-low hover:bg-surface-container"} text-on-surface-variant`}
                aria-label={`${t} を追加`}
              >
                + #{t}
              </button>
            </li>
          ))}
        {!full && (
          <li>
            {adding ? (
              <input
                id={id}
                autoFocus
                value={draft}
                maxLength={TAG_MAX}
                aria-label="タグを入力して Enter"
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  if (draft.trim()) add(draft);
                  setAdding(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    add(draft);
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setDraft("");
                    setAdding(false);
                  }
                }}
                placeholder="例：資料作成"
                className="h-8 w-36 rounded-full bg-surface-container-lowest px-3 font-label-md text-base text-on-surface ring-2 ring-primary/30 outline-none md:text-label-md"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className={`${chip} bg-surface-container px-2.5 text-primary hover:bg-surface-container-high`}
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden>
                  add
                </span>
                タグ追加
              </button>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
