"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordReset, signIn, signInWithProvider, signUp } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/common";
import { FormMessage, primaryBtn } from "@/components/forms/field";

type Mode = "signup" | "login" | "reset";

const init: ActionState = {};

/** 認証画面の入力欄（デザイン：白い面に影、左にアイコン） */
const shellCls =
  "relative flex w-full items-center rounded-xl bg-surface-container-lowest shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/30 has-[input[aria-invalid=true]]:ring-2 has-[input[aria-invalid=true]]:ring-error/40";
const fieldInputCls =
  "h-12 w-full min-w-0 bg-transparent pl-space-xs font-body-md text-base text-on-surface placeholder:text-outline-variant focus:outline-none md:text-body-md";

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

  const emailField = (
    <div className="flex flex-col gap-1">
      <label htmlFor="email" className="flex items-center justify-between font-label-md text-label-md font-bold text-on-surface">
        <span>メールアドレス</span>
        <span className="font-body-sm text-[11px] text-error">必須</span>
      </label>
      <div className={shellCls}>
        <span className="material-symbols-outlined pl-space-md text-[20px] text-on-surface-variant" aria-hidden>
          mail
        </span>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className={`${fieldInputCls} pr-space-md`}
          placeholder="your@email.com"
          aria-invalid={!!fields.email}
        />
      </div>
      <FieldError message={fields.email} />
    </div>
  );

  if (mode === "reset") {
    return (
      <form action={resetAction} className="mt-space-lg flex flex-col gap-space-md">
        <p className="font-body-md text-body-md text-on-surface-variant">登録したメールアドレスに、パスワード再設定用のリンクを送ります。</p>
        {emailField}
        <FormMessage state={resetState} />
        <button className={`${primaryBtn} mt-space-xs w-full py-3.5`} disabled={pending}>
          再設定メールを送る
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            send
          </span>
        </button>
        <Link href={`/login${q}`} className="mx-auto inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">
          <span className="material-symbols-outlined text-[16px]" aria-hidden>
            arrow_back
          </span>
          ログインに戻る
        </Link>
      </form>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="mt-space-md flex w-full items-center rounded-full bg-surface-container p-1 shadow-inner"
        role="tablist"
        aria-label="登録またはログイン"
      >
        {(["signup", "login"] as const).map((m) => (
          <Link
            key={m}
            href={`/${m}${q}`}
            role="tab"
            aria-selected={mode === m}
            replace
            className={`flex min-h-10 flex-1 items-center justify-center rounded-full font-label-md text-label-md transition-all ${mode === m ? "bg-surface-container-lowest font-bold text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            {m === "signup" ? "新規登録" : "ログイン"}
          </Link>
        ))}
      </div>

      {notice && (
        <div className="mt-space-md">
          <FormMessage state={{ error: notice }} />
        </div>
      )}

      <form action={mode === "signup" ? signupAction : loginAction} className="flex flex-col">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="mode" value={mode} />

        <div className="mt-space-lg flex flex-col gap-space-sm">
          <button
            name="provider"
            value="google"
            formAction={oauthAction}
            formNoValidate
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-surface-container-lowest text-on-surface shadow-sm transition-transform hover:bg-surface-container-low active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleMark />
            <span className="font-headline-sm text-headline-sm">Google で続ける</span>
          </button>
          <button
            name="provider"
            value="x"
            formAction={oauthAction}
            formNoValidate
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-on-surface text-surface-container-lowest shadow-sm transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="font-headline-sm text-headline-sm">X (Twitter) で続ける</span>
          </button>
          <FormMessage state={oauthState.error ? oauthState : undefined} />
        </div>

        <div className="my-space-lg flex items-center gap-space-sm">
          <span className="h-px flex-1 bg-surface-container-highest" />
          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">またはメールアドレスで</span>
          <span className="h-px flex-1 bg-surface-container-highest" />
        </div>

        <div className="flex flex-col gap-space-md">
          {emailField}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="font-label-md text-label-md font-bold text-on-surface">
                パスワード
                <span className="sr-only">（必須）</span>
              </label>
              {mode === "signup" && <span className="font-body-sm text-[11px] text-on-surface-variant">8文字以上</span>}
            </div>
            <div className={shellCls}>
              <span className="material-symbols-outlined pl-space-md text-[20px] text-on-surface-variant" aria-hidden>
                lock
              </span>
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={8}
                required
                className={`${fieldInputCls} pr-11`}
                placeholder="8文字以上"
                aria-invalid={!!fields.password}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
                className="absolute top-0 right-0 flex h-12 w-11 items-center justify-center text-on-surface-variant transition-transform hover:text-on-surface active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden>
                  {show ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <FieldError message={fields.password} />
          </div>

          {mode === "signup" ? (
            <div className="pt-1">
              <div className="flex items-start gap-space-xs">
                <input
                  id="agree"
                  type="checkbox"
                  name="agree"
                  className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-primary-container"
                  aria-invalid={!!fields.agree}
                />
                <label htmlFor="agree" className="font-body-sm text-body-sm leading-tight text-on-surface-variant select-none">
                  <Link href="/terms" target="_blank" className="font-bold text-primary hover:underline">
                    利用規約
                  </Link>{" "}
                  および{" "}
                  <Link href="/privacy" target="_blank" className="font-bold text-primary hover:underline">
                    プライバシーポリシー
                  </Link>{" "}
                  に同意して登録する
                </label>
              </div>
              <FieldError message={fields.agree} />
            </div>
          ) : (
            <div className="text-right">
              <Link href="/login?reset=1" className="font-label-md text-label-md text-primary hover:underline">
                パスワードをお忘れの方はこちら
              </Link>
            </div>
          )}

          <FormMessage state={state} />
          <button className={`${primaryBtn} mt-space-xs w-full py-3.5`} disabled={pending}>
            {mode === "signup" ? "アカウントを作成してはじめる" : "ログインする"}
            <span className="material-symbols-outlined text-[20px]" aria-hidden>
              arrow_forward
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-0.5 flex items-center gap-1 font-label-md text-label-md text-error" role="alert">
      <span className="material-symbols-outlined text-[16px]" aria-hidden>
        error
      </span>
      {message}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}
