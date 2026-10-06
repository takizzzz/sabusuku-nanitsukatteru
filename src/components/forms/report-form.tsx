"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Flag, ShieldCheck } from "lucide-react";
import { Field, FormMessage, inputCls } from "@/components/forms/field";
import type { ActionState } from "@/lib/actions/common";
import { createReport } from "@/lib/actions/community";
import { REPORT_REASONS } from "@/lib/options";

export function ReportForm({ type, targetId, backHref }: { type: "stack" | "comment"; targetId: string; backHref: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createReport, {});
  const [detail, setDetail] = useState("");
  const f = state.fields ?? {};

  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <FormMessage state={state} />
        <Link href={backHref} className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 font-bold hover:border-accent">
          元のページに戻る
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="targetId" value={targetId} />
      <fieldset className="space-y-2">
        <legend className="mb-2 flex items-center gap-2 text-base font-extrabold">
          通報の理由
          <span className="rounded bg-danger-soft px-1.5 py-px text-[10px] font-bold text-danger">必須</span>
        </legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-4 has-checked:border-danger has-checked:bg-danger-soft/40">
            <input type="radio" name="reason" value={r.id} required className="mt-1 size-4 accent-[var(--danger)]" />
            <span>
              <span className="block text-sm font-bold">{r.label}</span>
              <span className="block text-xs text-muted">{r.help}</span>
            </span>
          </label>
        ))}
        {f.reason && <p className="text-xs font-bold text-danger" role="alert">{f.reason}</p>}
      </fieldset>

      <Field label="詳しい状況" optional htmlFor="detail" error={f.detail} counter={{ value: detail.length, max: 500 }}>
        <textarea
          id="detail"
          name="detail"
          rows={4}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="問題のある箇所や状況があれば書いてください"
          className={`${inputCls} py-2`}
        />
      </Field>

      <p className="flex gap-3 rounded-xl bg-surface-2 p-4 text-sm text-muted">
        <ShieldCheck className="size-5 shrink-0 text-accent" aria-hidden />
        通報の内容は運営だけが確認します。通報したことや、あなたのアカウントが相手に知らされることはありません。
      </p>

      <FormMessage state={state} />
      <div className="space-y-2">
        <button disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-danger font-bold text-white hover:opacity-90 disabled:opacity-60">
          <Flag className="size-4" aria-hidden />
          {pending ? "送信中…" : "通報を送信する"}
        </button>
        <Link href={backHref} className="flex min-h-12 w-full items-center justify-center rounded-xl border border-line font-bold hover:border-accent">
          キャンセル
        </Link>
      </div>
    </form>
  );
}
