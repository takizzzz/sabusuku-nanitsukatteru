"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FormMessage } from "@/components/forms/field";
import type { ActionState } from "@/lib/actions/common";
import { createReport } from "@/lib/actions/community";
import { REPORT_REASONS } from "@/lib/options";

const DETAIL_MAX = 500;

export function ReportForm({ type, targetId, backHref }: { type: "stack" | "comment"; targetId: string; backHref: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createReport, {});
  const [detail, setDetail] = useState("");
  const f = state.fields ?? {};

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-space-md">
        <div className="w-full bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-xl flex items-center gap-space-sm" role="status">
          <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              check
            </span>
          </div>
          <div className="flex-1">
            <p className="font-label-md text-label-md font-bold">通報を受け付けました</p>
            <p className="font-body-sm text-body-sm text-inverse-on-surface/80">{state.message}</p>
          </div>
        </div>
        <Link
          href={backHref}
          className="w-full h-12 rounded-lg bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm font-semibold flex items-center justify-center shadow-sm active:scale-[0.98] transition-transform"
        >
          元のページに戻る
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-space-md">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="targetId" value={targetId} />

      <fieldset className="space-y-space-xs">
        <legend className="w-full flex items-center justify-between mb-space-xs">
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-1.5">
            <span>通報の理由</span>
            <span className="font-label-sm text-label-sm text-error bg-error-container/60 px-1.5 py-0.5 rounded-md">必須</span>
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">1つ選択</span>
        </legend>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label
              key={r.id}
              className="relative flex items-start gap-space-sm p-space-sm md:p-space-md rounded-xl bg-surface-container-lowest shadow-sm cursor-pointer transition-all hover:bg-surface-container-high/60 active:scale-[0.99] select-none has-checked:ring-1 has-checked:ring-error/40 has-focus-visible:ring-2 has-focus-visible:ring-primary/50"
            >
              <span className="pt-0.5">
                <input type="radio" name="reason" value={r.id} required className="peer sr-only" />
                <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center peer-checked:bg-error peer-checked:*:bg-surface-container-lowest transition-colors" aria-hidden>
                  <span className="w-2 h-2 rounded-full" />
                </span>
              </span>
              <span className="flex-1 min-w-0 pr-space-xs">
                <span className="block font-label-md text-label-md text-on-surface font-bold">{r.label}</span>
                <span className="block font-body-sm text-body-sm text-on-surface-variant mt-0.5">{r.help}</span>
              </span>
            </label>
          ))}
        </div>
        {f.reason && (
          <p className="font-body-sm text-body-sm text-error font-bold" role="alert">
            {f.reason}
          </p>
        )}
      </fieldset>

      <div className="space-y-space-xs">
        <div className="flex items-center justify-between">
          <label className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-1.5" htmlFor="detail">
            <span>詳しい状況</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-md">任意</span>
          </label>
          <span className={`num font-label-sm text-label-sm ${detail.length >= DETAIL_MAX - 20 ? "text-error font-bold" : "text-on-surface-variant"}`}>
            {detail.length} / {DETAIL_MAX}文字
          </span>
        </div>
        <div className="relative rounded-xl bg-surface-container-lowest shadow-sm focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
          <textarea
            id="detail"
            name="detail"
            rows={4}
            maxLength={DETAIL_MAX}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="問題のある箇所や状況があれば書いてください"
            className="w-full bg-transparent p-space-md font-body-md text-base md:text-body-md text-on-surface placeholder:text-outline/70 outline-none resize-none"
            aria-invalid={!!f.detail}
          />
        </div>
        {f.detail && (
          <p className="font-body-sm text-body-sm text-error font-bold" role="alert">
            {f.detail}
          </p>
        )}
      </div>

      <div className="bg-surface-container-high/70 rounded-xl p-space-md flex items-start gap-space-sm shadow-sm">
        <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center flex-shrink-0 text-secondary">
          <span className="material-symbols-outlined fill text-[20px]" aria-hidden>
            shield
          </span>
        </div>
        <div className="flex-1">
          <h2 className="font-label-md text-label-md text-on-surface font-bold mb-0.5">通報のプライバシー保護について</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            通報の内容は運営だけが確認します。通報したことや、あなたのアカウントが相手に知らされることはありません。
          </p>
        </div>
      </div>

      <FormMessage state={state.fields ? undefined : state} />

      <div className="pt-space-xs space-y-2 pb-space-lg">
        <button
          disabled={pending}
          className="w-full h-12 rounded-lg bg-error text-on-error font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-space-xs shadow-md shadow-error/20 active:scale-[0.98] transition-transform disabled:opacity-75"
        >
          <span className={`material-symbols-outlined text-[20px] ${pending ? "animate-spin" : ""}`} aria-hidden>
            {pending ? "sync" : "flag"}
          </span>
          <span>{pending ? "送信中…" : "通報を送信する"}</span>
        </button>
        <Link
          href={backHref}
          className="w-full h-12 rounded-lg bg-surface-container-lowest text-on-surface font-headline-sm text-headline-sm font-semibold flex items-center justify-center shadow-sm active:scale-[0.98] transition-transform"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
