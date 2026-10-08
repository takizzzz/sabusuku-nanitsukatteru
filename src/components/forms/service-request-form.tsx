"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Link2, Send, SlidersHorizontal } from "lucide-react";
import { Field, FormMessage, inputCls, primaryBtn } from "@/components/forms/field";
import type { ActionState } from "@/lib/actions/common";
import { createServiceRequest } from "@/lib/actions/community";
import type { Category } from "@/lib/types";

export function ServiceRequestForm({ categories, initialName }: { categories: Category[]; initialName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createServiceRequest, {});
  const [name, setName] = useState(initialName);
  const [comment, setComment] = useState("");
  const [currency, setCurrency] = useState<"JPY" | "USD">("JPY");
  const f = state.fields ?? {};

  if (state.ok) {
    return (
      <div className="space-y-4 rounded-2xl border border-line bg-card p-6 text-center">
        <FormMessage state={state} />
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/me" className={primaryBtn}>
            マイ構成に戻る
          </Link>
          <Link href="/services/request" className="inline-flex min-h-12 items-center rounded-xl px-4 font-bold text-accent-strong hover:underline">
            続けて申請する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <section className="space-y-5 rounded-2xl border border-line bg-card p-5">
        <Field label="サービス名" htmlFor="name" required error={f.name} counter={{ value: name.length, max: 50 }} hint="正式名称か、一般的に通じる名前を入力してください">
          <input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required className={inputCls} placeholder="例：Perplexity" aria-invalid={!!f.name} />
        </Field>
        <Field label="公式サイトのURL" htmlFor="url" required error={f.url}>
          <div className="relative">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
            <input id="url" name="url" type="url" required className={`${inputCls} pl-9`} placeholder="https://example.com" aria-invalid={!!f.url} />
          </div>
        </Field>
        <Field label="カテゴリ" htmlFor="categoryId" required error={f.categoryId}>
          <select id="categoryId" name="categoryId" required defaultValue="" className={inputCls} aria-invalid={!!f.categoryId}>
            <option value="" disabled>
              選択してください
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="space-y-5 rounded-2xl border border-line bg-card p-5">
        <h2 className="flex items-center gap-2 font-extrabold">
          <SlidersHorizontal className="size-4 text-accent" aria-hidden />
          料金・プラン（任意）
        </h2>
        <Field label="契約しているプラン名" htmlFor="planName" error={f.planName}>
          <input id="planName" name="planName" maxLength={50} className={inputCls} placeholder="例：Pro" />
        </Field>
        <Field label="月額（目安）" htmlFor="price" error={f.price} hint={currency === "USD" ? "ドル建ての場合は金額をそのまま入力してください。運営が円に換算します" : undefined}>
          <div className="flex gap-2">
            <input type="hidden" name="currency" value={currency} />
            <div className="flex shrink-0 rounded-lg bg-surface-3 p-1" role="radiogroup" aria-label="通貨">
              {(["JPY", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={currency === c}
                  onClick={() => setCurrency(c)}
                  className={`min-h-9 rounded-md px-3 text-sm font-bold ${currency === c ? "bg-accent text-on-accent" : "text-muted"}`}
                >
                  {c === "JPY" ? "¥ 円" : "$ USD"}
                </button>
              ))}
            </div>
            <input id="price" name="price" inputMode="numeric" pattern="[0-9]*" className={`${inputCls} num`} placeholder={currency === "JPY" ? "3000" : "20"} />
          </div>
        </Field>
        <Field label="ひとこと" htmlFor="comment" error={f.comment} counter={{ value: comment.length, max: 300 }}>
          <textarea id="comment" name="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={`${inputCls} py-2`} placeholder="どんな用途で使っているかなど" />
        </Field>
      </section>

      <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted">
        申請内容は運営が確認してから追加します。追加されると、サブスクの追加画面で選べるようになります。
      </p>
      <FormMessage state={state} />
      <button className={`${primaryBtn} w-full`} disabled={pending}>
        <Send className="size-4" aria-hidden />
        {pending ? "送信中…" : "この内容で申請する"}
      </button>
    </form>
  );
}
