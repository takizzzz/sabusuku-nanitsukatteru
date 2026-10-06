"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { TAG_MAX } from "@/lib/options";

/** 用途タグ：候補から選ぶ＋自由入力（F-06） */
export function TagInput({
  value,
  onChange,
  suggestions,
  name,
  id,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  name?: string;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = (t: string) => {
    const tag = t.replace(/^#/, "").trim().slice(0, TAG_MAX);
    if (tag && !value.includes(tag) && value.length < 10) onChange([...value, tag]);
    setDraft("");
  };
  const rest = [...new Set(suggestions)].filter((s) => !value.includes(s)).slice(0, 8);

  return (
    <div className="space-y-2">
      {name && value.map((t) => <input key={t} type="hidden" name={name} value={t} />)}
      <ul className="flex flex-wrap gap-1.5" aria-label="選んだタグ">
        {value.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="flex min-h-9 items-center gap-1 rounded-full bg-accent px-3 text-xs font-bold text-on-accent"
              aria-label={`${t} を外す`}
            >
              #{t}
              <X className="size-3.5" aria-hidden />
            </button>
          </li>
        ))}
        {rest.map((t) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => add(t)}
              className="flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-xs font-bold text-muted hover:border-accent"
            >
              <Plus className="size-3.5" aria-hidden />
              {t}
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          id={id}
          value={draft}
          maxLength={TAG_MAX}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              add(draft);
            }
          }}
          placeholder="タグを追加（例：資料作成）"
          className="min-h-10 flex-1 rounded-lg border border-line bg-surface-2 px-3 text-base outline-none focus:border-accent md:text-sm"
        />
        <button type="button" onClick={() => add(draft)} className="min-h-10 rounded-lg border border-line px-3 text-sm font-bold hover:border-accent">
          追加
        </button>
      </div>
    </div>
  );
}
