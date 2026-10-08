"use client";

import { useActionState, useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { VISIBILITY_OPTIONS } from "@/components/visibility";
import { Field, FormMessage, inputCls, primaryBtn, secondaryBtn } from "@/components/forms/field";
import { deleteAccount, signOut, updatePassword } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/common";
import { setVisibility } from "@/lib/actions/profile";
import type { Visibility } from "@/lib/types";

/** 公開範囲（F-11） */
export function VisibilityForm({ value }: { value: Visibility }) {
  const [current, setCurrent] = useState(value);
  const [state, setState] = useState<ActionState>({});
  const [pending, start] = useTransition();
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
      <h2 className="font-extrabold">構成の公開範囲</h2>
      {VISIBILITY_OPTIONS.map(({ id, label, help, icon: Icon }) => (
        <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${current === id ? "border-accent bg-accent-soft/50" : "border-line"}`}>
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
            className="mt-1 accent-[var(--accent)]"
          />
          <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="block text-sm font-bold">{label}</span>
            <span className="block text-xs text-muted">{help}</span>
          </span>
        </label>
      ))}
      <p className="text-xs text-subtle">サブスクごとの非公開は、マイ構成の各行から切り替えられます。</p>
      <FormMessage state={state} />
    </section>
  );
}

export function PasswordForm({ reset }: { reset: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePassword, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-card p-5">
      <h2 className="font-extrabold">{reset ? "新しいパスワードを設定" : "パスワードの変更"}</h2>
      <Field label="新しいパスワード" htmlFor="password" required hint="8文字以上" error={f.password}>
        <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className={inputCls} />
      </Field>
      <Field label="確認のためもう一度" htmlFor="confirm" required error={f.confirm}>
        <input id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" className={inputCls} />
      </Field>
      <FormMessage state={state} />
      <button className={primaryBtn} disabled={pending}>
        パスワードを変更する
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className={`${secondaryBtn} w-full`}>
        <LogOut className="size-4" aria-hidden />
        ログアウト
      </button>
    </form>
  );
}

export function DeleteAccountForm({ confirmText }: { confirmText: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-danger/40 bg-card p-5">
      <h2 className="font-extrabold text-danger">退会する</h2>
      <p className="text-sm text-muted">
        プロフィール・構成・いいねなど、登録したデータはすべて削除され、元に戻せません。集計済みの統計（個人を特定できない数値）は残ることがあります。
      </p>
      <Field label={`確認のため「${confirmText}」と入力`} htmlFor="confirmDelete" error={state.fields?.confirm}>
        <input id="confirmDelete" name="confirm" autoCapitalize="off" className={inputCls} />
      </Field>
      <FormMessage state={state.fields ? undefined : state} />
      <button disabled={pending} className="min-h-11 rounded-xl bg-danger px-5 font-bold text-white hover:opacity-90 disabled:opacity-60">
        {pending ? "処理中…" : "退会する"}
      </button>
    </form>
  );
}
