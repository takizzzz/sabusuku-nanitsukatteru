"use client";

import { useActionState, useTransition, useState } from "react";
import type { ActionState } from "@/lib/actions/common";

/** 管理画面用：サーバー関数を呼ぶフォームと結果表示 */
export function ActionForm({
  action,
  children,
  className = "",
  submitLabel = "保存",
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="min-h-9 rounded-md bg-accent px-3 text-xs font-bold text-on-accent disabled:opacity-60">
          {pending ? "処理中…" : submitLabel}
        </button>
        {(state.error || state.message) && (
          <span role="status" className={`text-xs font-bold ${state.error ? "text-danger" : "text-ok"}`}>
            {state.error ?? state.message}
          </span>
        )}
      </div>
    </form>
  );
}

export function ActionButton({
  action,
  label,
  confirmText,
  tone = "default",
}: {
  action: () => Promise<ActionState>;
  label: string;
  confirmText?: string;
  tone?: "default" | "danger";
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ActionState>({});
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirmText && !confirm(confirmText)) return;
          start(async () => setState(await action()));
        }}
        className={`min-h-8 rounded-md border px-2 text-xs font-bold disabled:opacity-60 ${tone === "danger" ? "border-danger text-danger" : "border-line hover:border-accent"}`}
      >
        {label}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </span>
  );
}
