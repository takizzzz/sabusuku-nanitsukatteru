import type { ActionState } from "@/lib/actions/common";

/** デザインの入力欄（bg-surface-container-low、フォーカスで一段明るく＋リング） */
export const inputCls =
  "w-full min-h-11 rounded-xl bg-surface-container-low px-3 font-body-md text-base text-on-surface outline-none transition-all placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 aria-invalid:ring-2 aria-invalid:ring-error/40 md:text-body-md";

/** 入力欄の外枠だけ（¥ や @ の前置きつき入力で使う） */
export const inputShellCls =
  "flex min-h-11 w-full items-center rounded-xl bg-surface-container-low text-on-surface transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20";

/** primary-container の上の文字。ダークでは on-primary が暗い色になるため on-primary-container に切り替える */
export const onPrimaryContainer = "bg-primary-container text-on-primary dark:text-on-primary-container";

export const primaryBtn = `inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl px-5 font-headline-sm text-headline-sm font-bold shadow-md transition-all hover:bg-primary hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-primary-container dark:hover:brightness-110 ${onPrimaryContainer}`;

export const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-surface-container-high px-4 font-label-md text-label-md font-bold text-on-surface transition-all hover:bg-surface-container-highest active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

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
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-space-xs">
        <label htmlFor={htmlFor} className="font-label-md text-label-md font-bold text-on-surface">
          {label}
          {required && (
            <>
              <span className="ml-0.5 text-error" aria-hidden>
                {" "}*
              </span>
              <span className="sr-only">（必須）</span>
            </>
          )}
        </label>
        {optional && <span className="font-label-sm text-label-sm text-outline">任意</span>}
        {counter && (
          <span className={`num ml-auto font-label-sm text-label-sm ${counter.value > counter.max ? "text-error" : "text-on-surface-variant"}`}>
            {counter.value} / {counter.max}文字
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="flex items-center gap-1 font-label-md text-label-md text-error" role="alert">
          <span className="material-symbols-outlined text-[16px]" aria-hidden>
            error
          </span>
          {error}
        </p>
      ) : (
        hint && <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
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
      className={`flex items-start gap-2 rounded-xl px-space-md py-3 font-body-md text-body-md font-semibold ${ok ? "bg-primary-fixed text-on-primary-fixed-variant" : "bg-error-container text-on-error-container"}`}
    >
      <span className="material-symbols-outlined mt-px shrink-0 text-[20px]" aria-hidden>
        {ok ? "check_circle" : "error"}
      </span>
      {state.error ?? state.message}
    </p>
  );
}
