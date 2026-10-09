"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/forms/field";
import type { ActionState } from "@/lib/actions/common";
import { createServiceRequest } from "@/lib/actions/community";
import type { Category } from "@/lib/types";

const fieldBase =
  "w-full px-3.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-base md:text-body-md outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 aria-invalid:ring-2 aria-invalid:ring-error/60 transition-all";
const inputCls = `${fieldBase} h-11`;
const labelCls = "font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-1.5";

function Required() {
  return <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold">必須</span>;
}

function FieldNote({ error, hint }: { error?: string; hint?: string }) {
  if (error)
    return (
      <p className="font-body-sm text-body-sm text-error font-bold" role="alert">
        {error}
      </p>
    );
  return hint ? <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p> : null;
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={`num font-label-sm text-label-sm ${value > max ? "text-error" : "text-outline"}`}>
      {value}/{max}
    </span>
  );
}

export function ServiceRequestForm({ categories, initialName }: { categories: Category[]; initialName: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(createServiceRequest, {});
  const [name, setName] = useState(initialName);
  const [comment, setComment] = useState("");
  const [currency, setCurrency] = useState<"JPY" | "USD">("JPY");
  const f = state.fields ?? {};

  if (state.ok) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center text-center" role="status">
        <div className="w-14 h-14 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-space-md">
          <span className="material-symbols-outlined fill text-[32px]" aria-hidden>
            check_circle
          </span>
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface font-bold mb-1">申請を受け付けました</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">{state.message}</p>
        <div className="w-full flex flex-col gap-space-sm">
          <Link href="/me" className="w-full h-11 rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm font-bold shadow-sm flex items-center justify-center">
            マイ構成に戻る
          </Link>
          <Link href="/services/request" className="py-2.5 font-body-md text-body-md text-primary font-bold hover:underline">
            続けて申請する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-space-md">
      {/* 必須項目 */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={labelCls} htmlFor="name">
              サービス名
              <Required />
            </label>
            <Counter value={name.length} max={50} />
          </div>
          <input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
            className={inputCls}
            placeholder="例：Perplexity"
            aria-invalid={!!f.name}
          />
          <FieldNote error={f.name} hint="正式名称か、一般的に通じる名前を入力してください" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="url">
            公式サイト / サービスURL
            <Required />
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" aria-hidden>
              link
            </span>
            <input id="url" name="url" type="url" required className={`${inputCls} pl-9`} placeholder="https://example.com" aria-invalid={!!f.url} />
          </div>
          <FieldNote error={f.url} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="categoryId">
            カテゴリ
            <Required />
          </label>
          <div className="relative flex items-center">
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue=""
              className={`${inputCls} pr-10 appearance-none cursor-pointer`}
              aria-invalid={!!f.categoryId}
            >
              <option value="" disabled>
                選択してください
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 pointer-events-none text-outline text-[20px]" aria-hidden>
              expand_more
            </span>
          </div>
          <FieldNote error={f.categoryId} />
        </div>
      </div>

      {/* 任意項目 */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]" aria-hidden>
            tune
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">料金・プラン情報（任意）</h2>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="planName">
            契約プラン名
          </label>
          <input id="planName" name="planName" maxLength={50} className={inputCls} placeholder="例：Pro" aria-invalid={!!f.planName} />
          <FieldNote error={f.planName} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="price">
            月額費用（目安）/ 通貨
          </label>
          <div className="flex items-center gap-2">
            <input type="hidden" name="currency" value={currency} />
            <div className="h-11 p-1 bg-surface-container-low rounded-lg flex items-center flex-shrink-0" role="radiogroup" aria-label="通貨">
              {(["JPY", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={currency === c}
                  onClick={() => setCurrency(c)}
                  className={`h-9 px-3 rounded-md font-label-md text-label-md font-bold transition-all ${
                    currency === c ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {c === "JPY" ? "¥ JPY" : "$ USD"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline font-price-md text-price-md pointer-events-none" aria-hidden>
                {currency === "JPY" ? "¥" : "$"}
              </span>
              <input
                id="price"
                name="price"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`${inputCls} num pl-8 font-price-md md:text-price-md`}
                placeholder={currency === "JPY" ? "3000" : "20"}
                aria-invalid={!!f.price}
              />
            </div>
          </div>
          <FieldNote error={f.price} hint={currency === "USD" ? "ドル建ての場合は金額をそのまま入力してください。運営が円に換算します" : undefined} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={labelCls} htmlFor="comment">
              申請理由・使い分けのひとこと
            </label>
            <Counter value={comment.length} max={300} />
          </div>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`${fieldBase} p-3.5 resize-none`}
            placeholder="どんな用途で使っているかなど"
            aria-invalid={!!f.comment}
          />
          <FieldNote error={f.comment} />
        </div>
      </div>

      {/* 申請後の流れ */}
      <div className="bg-surface-container rounded-xl p-space-md flex items-start gap-space-sm">
        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5 flex-shrink-0" aria-hidden>
          fact_check
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">申請後の流れ</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            申請内容は運営が確認してから追加します。追加されると、サブスクの追加画面で選べるようになります。
          </p>
        </div>
      </div>

      <FormMessage state={state.fields ? undefined : state} />

      <div className="flex flex-col items-center gap-space-sm pt-space-xs">
        <button
          className="w-full h-12 rounded-lg bg-primary-container text-on-primary dark:text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
          disabled={pending}
        >
          <span className={`material-symbols-outlined text-[20px] ${pending ? "animate-spin" : ""}`} aria-hidden>
            {pending ? "progress_activity" : "send"}
          </span>
          <span>{pending ? "送信中…" : "この内容で申請する"}</span>
        </button>
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/me"))}
          className="py-2.5 px-4 font-body-md text-body-md text-outline hover:text-on-surface font-medium transition-colors"
        >
          キャンセルして戻る
        </button>
      </div>
    </form>
  );
}
