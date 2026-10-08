import { CircleAlert, CircleCheck } from "lucide-react";
import type { ActionState } from "@/lib/actions/common";

export const inputCls =
  "w-full min-h-11 rounded-lg border border-line bg-surface-2 px-3 text-base outline-none placeholder:text-subtle focus:border-accent focus:ring-2 focus:ring-accent/25 aria-invalid:border-danger md:text-sm";

export const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-accent px-5 font-bold text-on-accent shadow-sm hover:bg-accent-strong disabled:opacity-60";

export const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-card px-4 font-bold hover:border-accent disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  error,
  counter,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  counter?: { value: number; max: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-bold">
          {label}
        </label>
        {required && <span className="rounded bg-danger-soft px-1.5 py-px text-[10px] font-bold text-danger">必須</span>}
        {optional && <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-bold text-subtle">任意</span>}
        {counter && (
          <span className={`num ml-auto text-xs ${counter.value > counter.max ? "font-bold text-danger" : "text-subtle"}`}>
            {counter.value} / {counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-xs font-bold text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-subtle">{hint}</p>
      )}
    </div>
  );
}

/** フォーム全体の成功・失敗メッセージ */
export function FormMessage({ state }: { state: ActionState | undefined }) {
  if (!state?.error && !state?.message) return null;
  const ok = !state.error;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${ok ? "bg-accent-soft text-accent-strong" : "bg-danger-soft text-danger"}`}
    >
      {ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
      {state.error ?? state.message}
    </p>
  );
}
