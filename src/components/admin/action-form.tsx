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
        <button disabled={pending} className="min-h-9 rounded-lg bg-primary-container px-4 font-label-md text-label-md font-bold text-white shadow-sm transition-colors hover:bg-primary disabled:opacity-60">
          {pending ? "処理中…" : submitLabel}
        </button>
        {(state.error || state.message) && (
          <span role="status" className={`font-label-sm text-label-sm font-bold ${state.error ? "text-error" : "text-secondary"}`}>
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
        className={`min-h-8 rounded-lg px-3 font-label-sm text-label-sm font-bold transition-colors disabled:opacity-60 ${
          tone === "danger"
            ? "bg-error-container text-on-error-container hover:opacity-90"
            : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
        }`}
      >
        {label}
      </button>
      {state.error && <span className="font-label-sm text-label-sm text-error">{state.error}</span>}
    </span>
  );
}
