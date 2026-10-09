"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Field, FormMessage, inputCls, inputShellCls, onPrimaryContainer, primaryBtn } from "@/components/forms/field";
import { ServicePicker } from "@/components/forms/service-picker";
import { StarInput } from "@/components/forms/star-input";
import { TagInput } from "@/components/forms/tag-input";
import { ServiceLogo } from "@/components/service-logo";
import type { ActionState } from "@/lib/actions/common";
import { deleteSubscription, saveSubscription } from "@/lib/actions/subscriptions";
import { monthlyOfPlan, type Catalog } from "@/lib/catalog";
import { yen } from "@/lib/format";
import { CANCEL_REASONS, COMMENT_MAX } from "@/lib/options";
import type { UserSubscription } from "@/lib/types";

export type DialogTarget =
  | { kind: "new"; serviceId?: string }
  | { kind: "edit"; sub: UserSubscription; status?: "active" | "cancelled" };

export const SERVICE_SEARCH_ID = "sub-service-search";

const icon = "material-symbols-outlined";

/**
 * S-11 サブスク追加・編集。
 * スマートフォンは下から出るシート、タブレットは中央のモーダル、
 * PC（xl 以上）は S-10 の右カラムに置いたパネル（モーダルにしない dialog）。
 */
export function SubscriptionDialog({
  catalog,
  target,
  inline = false,
  onClose,
  onDone,
}: {
  catalog: Catalog;
  target: DialogTarget;
  inline?: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const sub = target.kind === "edit" ? target.sub : null;
  const [serviceId, setServiceId] = useState<string | null>(sub?.serviceId ?? (target.kind === "new" ? (target.serviceId ?? null) : null));
  const plans = catalog.plans.filter((p) => p.serviceId === serviceId);
  const firstPlan = plans[0] ?? null;
  const [planId, setPlanId] = useState<string | null>(sub ? sub.planId : (firstPlan?.id ?? null));
  const [price, setPrice] = useState(sub ? String(sub.monthlyPrice) : firstPlan ? String(monthlyOfPlan(firstPlan)) : "");
  const [tags, setTags] = useState<string[]>(sub?.tags ?? []);
  const [comment, setComment] = useState(sub?.comment ?? "");
  const [satisfaction, setSatisfaction] = useState<number | null>(sub?.satisfaction ?? null);
  const [status, setStatus] = useState<"active" | "cancelled">(target.kind === "edit" ? (target.status ?? target.sub.status) : "active");
  const [detail, setDetail] = useState(sub?.cancelReasonDetail ?? "");
  const [state, action, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await saveSubscription(prev, fd);
    if (r.ok) onDone(r.message ?? "保存しました。");
    return r;
  }, {});
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // PC のパネルは open 属性で出す（show() だと先頭のリンクにフォーカスが移ってしまう）
    const el = ref.current;
    if (!inline && el && !el.open) el.showModal();
  }, [inline]);

  const service = catalog.services.find((s) => s.id === serviceId) ?? null;
  const f = state.fields ?? {};
  const thisMonth = new Date().toISOString().slice(0, 7);
  const yearly = plans.find((p) => p.id === planId)?.billingCycle === "yearly";
  const title = sub ? (status === "cancelled" && sub.status === "active" ? "解約済みにする" : "サブスクを編集") : "サブスクを追加";

  function pickService(id: string) {
    setServiceId(id);
    const p = catalog.plans.find((x) => x.serviceId === id) ?? null;
    setPlanId(p?.id ?? null);
    setPrice(p ? String(monthlyOfPlan(p)) : "");
  }

  return (
    <dialog
      ref={ref}
      open={inline || undefined}
      onClose={onClose}
      aria-labelledby="sub-dialog-title"
      className={
        inline
          ? "static m-0 w-full max-w-none rounded-xl bg-surface-container-lowest p-0 text-on-surface shadow-lg"
          : "mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-0 text-on-surface shadow-lg backdrop:bg-black/50 md:my-auto md:max-w-xl md:rounded-2xl"
      }
    >
      <form action={action} className={`flex flex-col gap-space-md p-space-md ${inline ? "sm:p-space-lg" : "md:p-space-lg"}`}>
        {!inline && <span className="mx-auto -mt-1 h-1 w-10 rounded-full bg-outline-variant md:hidden" aria-hidden />}
        <div className="flex items-center justify-between gap-space-sm pb-1">
          <div className="flex items-center gap-1.5">
            <span className={`${icon} text-[22px] text-primary-container dark:text-primary`} aria-hidden>
              {sub ? "edit_note" : "post_add"}
            </span>
            <h2 id="sub-dialog-title" className="font-headline-sm text-headline-sm font-bold text-on-surface md:font-headline-md md:text-headline-md">
              {title}
            </h2>
          </div>
          {inline ? (
            <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold text-on-primary-fixed-variant">
              {sub ? "編集中" : "新規追加"}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="閉じる"
              className="-mr-2 flex size-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <span className={`${icon} text-[22px]`} aria-hidden>
                close
              </span>
            </button>
          )}
        </div>

        {sub && <input type="hidden" name="id" value={sub.id} />}
        <input type="hidden" name="serviceId" value={serviceId ?? ""} />
        <input type="hidden" name="planId" value={planId ?? ""} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="monthlyPrice" value={price} />

        {service ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
            <ServiceLogo service={service} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-headline-sm text-headline-sm text-on-surface">{service.name}</p>
              {service.company && <p className="font-body-sm text-body-sm text-on-surface-variant">{service.company}</p>}
            </div>
            {!sub && (
              <button
                type="button"
                onClick={() => setServiceId(null)}
                className="min-h-9 rounded-lg px-2.5 font-label-md text-label-md font-bold text-primary hover:bg-surface-container"
              >
                変更
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={SERVICE_SEARCH_ID} className="font-label-md text-label-md font-bold text-on-surface md:font-headline-sm md:text-headline-sm">
                サービス名
                <span className="text-error" aria-hidden>
                  {" "}*
                </span>
                <span className="sr-only">（必須）</span>
              </label>
              <Link href="/services/request" className="inline-flex items-center gap-0.5 font-label-sm text-label-sm text-primary hover:underline">
                見つからない場合は申請
                <span className={`${icon} text-[13px]`} aria-hidden>
                  open_in_new
                </span>
              </Link>
            </div>
            <ServicePicker catalog={catalog} selected={[]} onToggle={(s) => pickService(s.id)} limit={8} inputId={SERVICE_SEARCH_ID} />
            {f.serviceId && <p className="font-label-md text-label-md text-error">{f.serviceId}</p>}
          </div>
        )}

        {service && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="planSel" className="font-label-md text-label-md font-bold text-on-surface md:font-headline-sm md:text-headline-sm">
                  プラン名
                </label>
                <div className="relative">
                  <select
                    id="planSel"
                    value={planId ?? ""}
                    onChange={(e) => {
                      const p = plans.find((x) => x.id === e.target.value);
                      setPlanId(p?.id ?? null);
                      if (p) setPrice(String(monthlyOfPlan(p)));
                    }}
                    className={`${inputCls} appearance-none truncate pr-9`}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}（¥{yen(p.price)}/{p.billingCycle === "yearly" ? "年" : "月"}）
                      </option>
                    ))}
                    <option value="">その他・プラン不明</option>
                  </select>
                  <span className={`${icon} pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[20px] text-outline`} aria-hidden>
                    expand_more
                  </span>
                </div>
                {f.planId && <p className="font-label-md text-label-md text-error">{f.planId}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="monthlyPrice" className="font-label-md text-label-md font-bold text-on-surface md:font-headline-sm md:text-headline-sm">
                  月額換算（円）
                  <span className="text-error" aria-hidden>
                    {" "}*
                  </span>
                  <span className="sr-only">（必須）</span>
                </label>
                <div className={inputShellCls}>
                  <span className="pl-3 font-label-md text-label-md text-on-surface-variant">¥</span>
                  <input
                    id="monthlyPrice"
                    inputMode="numeric"
                    required
                    value={price ? yen(Number(price)) : ""}
                    aria-invalid={!!f.monthlyPrice}
                    onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    className="num min-h-11 min-w-0 flex-1 bg-transparent px-1.5 font-price-md text-base font-bold outline-none md:text-price-md"
                  />
                  <span className="pr-3 font-label-sm text-label-sm text-outline">/月</span>
                </div>
                {f.monthlyPrice && <p className="font-label-md text-label-md text-error">{f.monthlyPrice}</p>}
              </div>
            </div>
            <p className="-mt-2 font-body-sm text-body-sm text-on-surface-variant">
              {yearly ? "※ 年額プランを12で割った額です。実際に払っている額に直せます。" : "※ プランから自動入力。実際に払っている額に直せます。"}
            </p>

            <div className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-bold text-on-surface md:font-headline-sm md:text-headline-sm">用途・タグ選択</span>
              <TagInput name="tags" value={tags} onChange={setTags} suggestions={[...(service.tags ?? []), ...catalog.popularTags]} boxed />
            </div>

            <Field label="使い分け・本音レビュー" htmlFor="comment" error={f.comment} counter={{ value: comment.length, max: COMMENT_MAX }}>
              <textarea
                id="comment"
                name="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ほかのサービスとの使い分けや、課金し続けている理由など"
                className={`${inputCls} resize-none py-2.5 font-body-sm leading-relaxed md:text-body-sm`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <span className="font-label-md text-label-md font-bold text-on-surface md:font-headline-sm md:text-headline-sm">満足度評価</span>
                <StarInput name="satisfaction" value={satisfaction} onChange={setSatisfaction} boxed />
                {f.satisfaction && <p className="font-label-md text-label-md text-error">{f.satisfaction}</p>}
              </div>
              <Field label="利用開始年月" htmlFor="startedOn" error={f.startedOn}>
                <input id="startedOn" name="startedOn" type="month" max={thisMonth} defaultValue={sub?.startedOn ?? ""} className={`${inputCls} min-w-0`} />
              </Field>
            </div>

            <fieldset className="flex flex-col justify-between gap-2 rounded-xl bg-surface-container-low p-space-sm sm:flex-row sm:items-center">
              <legend className="sr-only">ステータス</legend>
              <div aria-hidden>
                <span className="block font-label-md text-label-md font-bold text-on-surface md:font-headline-sm md:text-headline-sm">ステータス</span>
                <span className="font-body-sm text-body-sm text-outline">現在も課金していますか？</span>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {(["active", "cancelled"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={status === s}
                    onClick={() => setStatus(s)}
                    className={`min-h-9 rounded-md px-3 font-label-md text-label-md transition-colors ${status === s ? `${onPrimaryContainer} font-bold shadow-sm` : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    {s === "active" ? "契約中" : "解約済み"}
                  </button>
                ))}
              </div>
            </fieldset>

            {status === "cancelled" && (
              <div className="flex flex-col gap-space-md rounded-xl border border-dashed border-outline-variant p-space-md">
                <div className="grid gap-space-md sm:grid-cols-2">
                  <Field label="解約年月" optional htmlFor="cancelledOn" error={f.cancelledOn}>
                    <input id="cancelledOn" name="cancelledOn" type="month" max={thisMonth} defaultValue={sub?.cancelledOn ?? thisMonth} className={inputCls} />
                  </Field>
                  <Field label="解約理由" optional htmlFor="cancelReason" error={f.cancelReason}>
                    <select id="cancelReason" name="cancelReason" defaultValue={sub?.cancelReason ?? ""} className={inputCls}>
                      <option value="">選択しない</option>
                      {CANCEL_REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="理由の詳細" optional htmlFor="cancelReasonDetail" error={f.cancelReasonDetail} counter={{ value: detail.length, max: COMMENT_MAX }}>
                  <textarea
                    id="cancelReasonDetail"
                    name="cancelReasonDetail"
                    rows={2}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className={`${inputCls} resize-none py-2.5 font-body-sm md:text-body-sm`}
                  />
                </Field>
                <Field label="乗り換え先" optional htmlFor="switchedTo" error={f.switchedToServiceId}>
                  <select id="switchedTo" name="switchedToServiceId" defaultValue={sub?.switchedToServiceId ?? ""} className={inputCls}>
                    <option value="">なし</option>
                    {catalog.services
                      .filter((s) => s.id !== serviceId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
            )}
          </>
        )}

        <FormMessage state={state.ok ? undefined : state} />

        <div
          className={`flex items-center gap-2 pt-space-xs ${inline ? "" : "sticky bottom-0 -mx-space-md -mb-space-md border-t border-surface-container bg-surface-container-lowest px-space-md pt-3 pb-[max(env(safe-area-inset-bottom),12px)] md:-mx-space-lg md:-mb-space-lg md:px-space-lg"}`}
        >
          {sub && (
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                if (!confirm(`${service?.name ?? "このサブスク"} を構成から削除しますか？`)) return;
                setDeleting(true);
                const r = await deleteSubscription(sub.id);
                setDeleting(false);
                if (r.ok) onDone(r.message ?? "削除しました。");
                else alert(r.error);
              }}
              className="flex min-h-12 shrink-0 items-center gap-1 rounded-xl px-2.5 font-label-md text-label-md font-bold text-error hover:bg-error-container/50"
            >
              <span className={`${icon} text-[18px]`} aria-hidden>
                delete
              </span>
              削除
            </button>
          )}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className={`min-h-12 rounded-xl px-space-md font-label-md text-label-md font-bold text-on-surface-variant transition-colors hover:text-on-surface ${sub ? "ml-auto" : "w-1/3 bg-surface-container-high sm:ml-auto sm:w-auto sm:bg-transparent"}`}
          >
            キャンセル
          </button>
          <button className={`${primaryBtn} flex-1 px-space-md sm:flex-none sm:px-space-lg`} disabled={pending || !service}>
            <span className={`${icon} text-[20px]`} aria-hidden>
              save
            </span>
            {pending ? "保存中…" : "構成に保存する"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
