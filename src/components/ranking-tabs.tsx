"use client";

import { useId, useState } from "react";

/** トップの「注目のAIツール」の並び替えタブ（中身はサーバーで描いたものを切り替えるだけ） */
export function RankingTabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return (
    <div className="flex flex-col gap-space-sm">
      <div role="tablist" aria-label="並び替え" className="flex items-center rounded-lg bg-surface-container p-1">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${id}-panel-${i}`}
            onClick={() => setActive(i)}
            className={`flex-1 rounded-md py-1 text-center font-label-md text-label-md transition-colors ${
              active === i ? "bg-surface-container-lowest font-bold text-primary shadow-sm" : "font-medium text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={active !== i}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
