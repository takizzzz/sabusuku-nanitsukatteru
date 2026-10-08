"use client";

import { useActionState, useState, useTransition } from "react";
import { VISIBILITY_OPTIONS } from "@/components/visibility";
import { FormMessage } from "@/components/forms/field";
import { FieldError, Req, SettingsCard, settingsInput, settingsLabel } from "@/components/settings/profile-summary";
import { deleteAccount, signOut, updatePassword } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/common";
import { setVisibility } from "@/lib/actions/profile";
import type { Visibility } from "@/lib/types";

const rowBtn =
  "flex-shrink-0 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md active:scale-95 shadow-sm hover:bg-surface-container-highest transition-colors";

/** 公開範囲（F-11）。選んだ時点で保存する */
export function VisibilityForm({ value }: { value: Visibility }) {
  const [current, setCurrent] = useState(value);
  const [state, setState] = useState<ActionState>({});
  const [pending, start] = useTransition();
  return (
    <SettingsCard icon="visibility" title="構成の公開範囲">
      <p className="font-body-sm text-body-sm text-on-surface-variant -mt-space-sm">あなたが登録したサブスク構成を、だれに見せるかを選びます。選ぶとすぐに保存されます。</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="構成の公開範囲">
        {VISIBILITY_OPTIONS.map(({ id, label, help }) => (
          <label
            key={id}
            className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container has-checked:bg-primary-fixed has-checked:ring-1 has-checked:ring-primary/40 transition-colors"
          >
            <input
              type="radio"
              name="visibility"
              checked={current === id}
              disabled={pending}
              onChange={() =>
                start(async () => {
                  const r = await setVisibility(id);
                  setState(r);
                  if (r.ok) setCurrent(id);
                })
              }
              className="accent-primary w-4 h-4 mt-1 flex-shrink-0"
            />
            <span className="flex-1">
              <span className="block font-headline-sm text-headline-sm text-on-surface">{label}</span>
              <span className="block font-body-sm text-body-sm text-on-surface-variant mt-0.5">{help}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant flex items-start gap-1">
        <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden>
          info
        </span>
        サブスクごとの非公開は、マイ構成の各行から切り替えられます。
      </p>
      <FormMessage state={state} />
    </SettingsCard>
  );
}

/** ログイン情報（メール・パスワード・ログアウト） */
export function LoginInfoCard({ email, reset }: { email: string | null; reset: boolean }) {
  return (
    <SettingsCard icon="security" title="ログイン・認証情報">
      <div className="flex flex-col gap-1.5">
        <span className={settingsLabel}>登録メールアドレス</span>
        <div className="p-3 rounded-xl bg-surface-container-low min-w-0">
          <p className="font-headline-sm text-headline-sm text-on-surface truncate">{email ?? "（ソーシャルログイン）"}</p>
        </div>
      </div>
      <PasswordForm reset={reset} />
      <SignOutButton />
    </SettingsCard>
  );
}

export function PasswordForm({ reset }: { reset: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePassword, {});
  const [open, setOpen] = useState(reset);
  const f = state.fields ?? {};
  return (
    <div className="flex flex-col gap-1.5">
      <span className={settingsLabel}>パスワード</span>
      <div className="rounded-xl bg-surface-container-low">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <p className="font-headline-sm text-headline-sm text-on-surface">{reset ? "新しいパスワードを設定" : "••••••••"}</p>
            {open && <p className="font-body-sm text-body-sm text-on-surface-variant">8文字以上で入力してください</p>}
          </div>
          {!open && (
            <button type="button" onClick={() => setOpen(true)} className={rowBtn} aria-expanded={false} aria-controls="password-form">
              変更する
            </button>
          )}
        </div>
        {open && (
          <form id="password-form" action={action} className="flex flex-col gap-space-sm px-3 pb-3">
            <div className="flex flex-col gap-1.5">
              <label className={settingsLabel} htmlFor="password">
                新しいパスワード
                <Req />
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className={`${settingsInput} bg-surface-container-lowest!`}
                aria-invalid={!!f.password}
              />
              <FieldError>{f.password}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={settingsLabel} htmlFor="confirm">
                確認のためもう一度
                <Req />
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className={`${settingsInput} bg-surface-container-lowest!`}
                aria-invalid={!!f.confirm}
              />
              <FieldError>{f.confirm}</FieldError>
            </div>
            <FormMessage state={state} />
            <div className="flex items-center gap-2">
              <button className="h-10 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:opacity-90 disabled:opacity-60" disabled={pending}>
                {pending ? "変更中…" : "パスワードを変更する"}
              </button>
              {!reset && (
                <button type="button" onClick={() => setOpen(false)} className="h-10 px-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface">
                  閉じる
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut} className="pt-2">
      <button className="w-full py-2.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-headline-sm text-headline-sm flex items-center justify-center gap-1.5 transition-colors">
        <span className="material-symbols-outlined text-[18px]" aria-hidden>
          logout
        </span>
        <span>ログアウト</span>
      </button>
    </form>
  );
}

export function DeleteAccountForm({ confirmText }: { confirmText: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  return (
    <SettingsCard icon="warning" title="退会する" tone="danger">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        プロフィール・構成・いいねなど、登録したデータはすべて削除され、元に戻せません。集計済みの統計（個人を特定できない数値）は残ることがあります。
      </p>
      {!open ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-error hover:text-on-error-container font-label-md text-label-md underline inline-flex items-center gap-1"
            aria-controls="delete-account-form"
            aria-expanded={false}
          >
            <span>退会手続き / アカウント削除</span>
            <span className="material-symbols-outlined text-[15px]" aria-hidden>
              arrow_forward
            </span>
          </button>
        </div>
      ) : (
        <form id="delete-account-form" action={action} className="flex flex-col gap-space-sm pt-1">
          <div className="flex flex-col gap-1.5">
            <label className={settingsLabel} htmlFor="confirmDelete">
              確認のため「{confirmText}」と入力
            </label>
            <input
              id="confirmDelete"
              name="confirm"
              autoCapitalize="off"
              className={`${settingsInput} bg-surface-container-lowest!`}
              aria-invalid={!!state.fields?.confirm}
            />
            <FieldError>{state.fields?.confirm}</FieldError>
          </div>
          <FormMessage state={state.fields ? undefined : state} />
          <div className="flex items-center gap-2">
            <button disabled={pending} className="h-11 px-5 rounded-lg bg-error text-on-error font-label-md text-label-md font-bold shadow-sm hover:opacity-90 disabled:opacity-60">
              {pending ? "処理中…" : "退会する"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="h-11 px-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface">
              やめる
            </button>
          </div>
        </form>
      )}
    </SettingsCard>
  );
}
