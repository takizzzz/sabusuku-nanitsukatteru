"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import { Field, FormMessage, inputCls, primaryBtn } from "@/components/forms/field";
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

/** S-11 サブスク追加・編集。スマートフォンは下から出るシート、PCは中央のパネル */
export function SubscriptionDialog({
  catalog,
  target,
  onClose,
  onDone,
}: {
  catalog: Catalog;
  target: DialogTarget;
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
    ref.current?.showModal();
  }, []);

  const service = catalog.services.find((s) => s.id === serviceId) ?? null;
  const f = state.fields ?? {};
  const thisMonth = new Date().toISOString().slice(0, 7);

  function pickService(id: string) {
    setServiceId(id);
    const p = catalog.plans.find((x) => x.serviceId === id) ?? null;
    setPlanId(p?.id ?? null);
    setPrice(p ? String(monthlyOfPlan(p)) : "");
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="sub-dialog-title"
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-card p-0 text-fg backdrop:bg-black/50 md:my-auto md:max-w-xl md:rounded-2xl"
    >
      <form action={action} className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <h2 id="sub-dialog-title" className="text-lg font-extrabold">
            {sub ? (status === "cancelled" && sub.status === "active" ? "解約済みにする" : "サブスクを編集") : "サブスクを追加"}
          </h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label="閉じる" className="flex size-10 items-center justify-center rounded-lg hover:bg-surface-2">
            <X className="size-5" />
          </button>
        </div>

        {sub && <input type="hidden" name="id" value={sub.id} />}
        <input type="hidden" name="serviceId" value={serviceId ?? ""} />
        <input type="hidden" name="planId" value={planId ?? ""} />
        <input type="hidden" name="status" value={status} />

        {service ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
            <ServiceLogo service={service} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{service.name}</p>
              {service.company && <p className="text-xs text-subtle">{service.company}</p>}
            </div>
            {!sub && (
              <button type="button" onClick={() => setServiceId(null)} className="text-sm font-bold text-accent-strong hover:underline">
                変更
              </button>
            )}
          </div>
        ) : (
          <Field label="サービス" required error={f.serviceId}>
            <ServicePicker catalog={catalog} selected={[]} onToggle={(s) => pickService(s.id)} limit={8} />
          </Field>
        )}

        {service && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="プラン" htmlFor="planSel" error={f.planId}>
                <select
                  id="planSel"
                  value={planId ?? ""}
                  onChange={(e) => {
                    const p = plans.find((x) => x.id === e.target.value);
                    setPlanId(p?.id ?? null);
                    if (p) setPrice(String(monthlyOfPlan(p)));
                  }}
                  className={inputCls}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}（¥{yen(p.price)}/{p.billingCycle === "yearly" ? "年" : "月"}）
                    </option>
                  ))}
                  <option value="">その他・プラン不明</option>
                </select>
              </Field>
              <Field
                label="月額（円）"
                htmlFor="monthlyPrice"
                required
                error={f.monthlyPrice}
                hint={plans.find((p) => p.id === planId)?.billingCycle === "yearly" ? "年額プランを12で割った額です" : "実際に払っている額に直せます"}
              >
                <div className="flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent">
                  <span className="pl-3 text-subtle">¥</span>
                  <input
                    id="monthlyPrice"
                    name="monthlyPrice"
                    inputMode="numeric"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    className="num min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base outline-none md:text-sm"
                  />
                  <span className="pr-3 text-xs text-subtle">/月</span>
                </div>
              </Field>
            </div>

            <Field label="用途タグ" optional>
              <TagInput name="tags" value={tags} onChange={setTags} suggestions={[...(service.tags ?? []), ...catalog.popularTags]} />
            </Field>

            <Field label="使い方コメント" optional htmlFor="comment" error={f.comment} counter={{ value: comment.length, max: COMMENT_MAX }}>
              <textarea
                id="comment"
                name="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="どんな場面で使っているか、ほかのサービスとの使い分けなど"
                className={`${inputCls} py-2`}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="満足度" optional error={f.satisfaction}>
                <StarInput name="satisfaction" value={satisfaction} onChange={setSatisfaction} />
              </Field>
              <Field label="利用開始年月" optional htmlFor="startedOn" error={f.startedOn}>
                <input id="startedOn" name="startedOn" type="month" max={thisMonth} defaultValue={sub?.startedOn ?? ""} className={inputCls} />
              </Field>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-bold">ステータス</legend>
              <div className="grid grid-cols-2 rounded-xl bg-surface-3 p-1">
                {(["active", "cancelled"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={status === s}
                    onClick={() => setStatus(s)}
                    className={`min-h-10 rounded-lg text-sm font-bold ${status === s ? "bg-card text-accent-strong shadow-sm" : "text-muted"}`}
                  >
                    {s === "active" ? "契約中" : "解約済み"}
                  </button>
                ))}
              </div>
            </fieldset>

            {status === "cancelled" && (
              <div className="space-y-4 rounded-xl border border-dashed border-line p-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    className={`${inputCls} py-2`}
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

        <div className="sticky bottom-0 -mx-5 flex items-center gap-2 border-t border-line bg-card px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
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
              className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-danger hover:bg-danger-soft"
            >
              <Trash2 className="size-4" aria-hidden />
              削除
            </button>
          )}
          <button type="button" onClick={() => ref.current?.close()} className="ml-auto min-h-11 rounded-xl px-4 text-sm font-bold text-muted hover:bg-surface-2">
            キャンセル
          </button>
          <button className={primaryBtn} disabled={pending || !service}>
            <Save className="size-4" aria-hidden />
            {pending ? "保存中…" : "構成に保存する"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
