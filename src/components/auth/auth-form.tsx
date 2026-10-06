"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { requestPasswordReset, signIn, signInWithProvider, signUp } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/common";
import { Field, FormMessage, inputCls, primaryBtn } from "@/components/forms/field";

type Mode = "signup" | "login" | "reset";

const init: ActionState = {};

export function AuthForm({ mode, next, notice }: { mode: Mode; next: string; notice?: string }) {
  const [signupState, signupAction, signingUp] = useActionState(signUp, init);
  const [loginState, loginAction, loggingIn] = useActionState(signIn, init);
  const [oauthState, oauthAction, redirecting] = useActionState(signInWithProvider, init);
  const [resetState, resetAction, resetting] = useActionState(requestPasswordReset, init);
  const [show, setShow] = useState(false);

  const state = { signup: signupState, login: loginState, reset: resetState }[mode];
  const fields = { ...oauthState.fields, ...state.fields };
  const pending = signingUp || loggingIn || redirecting || resetting;
  const q = next !== "/me" ? `?next=${encodeURIComponent(next)}` : "";

  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-5">
        <p className="text-sm text-muted">登録したメールアドレスに、パスワード再設定用のリンクを送ります。</p>
        <Field label="メールアドレス" htmlFor="email" required error={fields.email}>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} placeholder="your@email.com" />
        </Field>
        <FormMessage state={resetState} />
        <button className={`${primaryBtn} w-full`} disabled={pending}>
          再設定メールを送る
        </button>
        <Link href={`/login${q}`} className="block text-center text-sm font-bold text-accent-strong hover:underline">
          ログインに戻る
        </Link>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 rounded-xl bg-surface-3 p-1" role="tablist" aria-label="登録またはログイン">
        {(["signup", "login"] as const).map((m) => (
          <Link
            key={m}
            href={`/${m}${q}`}
            role="tab"
            aria-selected={mode === m}
            replace
            className={`flex min-h-11 items-center justify-center rounded-lg text-sm font-bold ${mode === m ? "bg-surface text-accent-strong shadow-sm" : "text-muted"}`}
          >
            {m === "signup" ? "新規登録" : "ログイン"}
          </Link>
        ))}
      </div>

      {notice && <FormMessage state={{ error: notice }} />}

      <form action={mode === "signup" ? signupAction : loginAction} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />
        <div className="space-y-3">
          <button
            name="provider"
            value="google"
            formAction={oauthAction}
            formNoValidate
            disabled={pending}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface font-bold shadow-sm hover:border-accent"
          >
            <GoogleMark />
            Google で続ける
          </button>
          <button
            name="provider"
            value="x"
            formAction={oauthAction}
            formNoValidate
            disabled={pending}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-fg font-bold text-bg hover:opacity-90"
          >
            <span aria-hidden className="text-lg leading-none">𝕏</span>X で続ける
          </button>
          <FormMessage state={oauthState.error ? oauthState : undefined} />
        </div>

        <div className="flex items-center gap-3 text-xs text-subtle">
          <span className="h-px flex-1 bg-line" />
          またはメールアドレスで
          <span className="h-px flex-1 bg-line" />
        </div>

        <Field label="メールアドレス" htmlFor="email" required error={fields.email}>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input id="email" name="email" type="email" autoComplete="email" required className={`${inputCls} pl-9`} placeholder="your@email.com" aria-invalid={!!fields.email} />
          </div>
        </Field>
        <Field label="パスワード" htmlFor="password" required hint={mode === "signup" ? "8文字以上" : undefined} error={fields.password}>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              className={`${inputCls} px-9`}
              placeholder="8文字以上"
              aria-invalid={!!fields.password}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
              className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-subtle"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        {mode === "signup" ? (
          <div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="agree" className="mt-0.5 size-5 accent-[var(--accent)]" />
              <span>
                <Link href="/terms" target="_blank" className="font-bold text-accent-strong underline">利用規約</Link>
                と
                <Link href="/privacy" target="_blank" className="font-bold text-accent-strong underline">プライバシーポリシー</Link>
                に同意して登録する
              </span>
            </label>
            {fields.agree && <p className="mt-1 text-xs font-bold text-danger" role="alert">{fields.agree}</p>}
          </div>
        ) : (
          <Link href={`/login?reset=1`} className="block text-right text-sm font-bold text-accent-strong hover:underline">
            パスワードを忘れた方
          </Link>
        )}

        <FormMessage state={state} />
        <button className={`${primaryBtn} w-full`} disabled={pending}>
          {mode === "signup" ? "アカウントを作成してはじめる" : "ログイン"}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
