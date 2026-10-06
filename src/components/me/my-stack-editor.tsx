"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  History,
  PencilLine,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CategoryBar } from "@/components/category-bar";
import { Price } from "@/components/price";
import { ServiceLogo } from "@/components/service-logo";
import { Stars } from "@/components/stars";
import { Tag } from "@/components/tag";
import { VISIBILITY_OPTIONS } from "@/components/visibility";
import type { ActionState } from "@/lib/actions/common";
import { setVisibility } from "@/lib/actions/profile";
import { deleteSubscription, reactivate, reorder, setHidden } from "@/lib/actions/subscriptions";
import type { Catalog } from "@/lib/catalog";
import { SITE_URL, yearMonth } from "@/lib/format";
import type { Stack, StackEntry } from "@/lib/stacks";
import { SubscriptionDialog, type DialogTarget } from "./subscription-dialog";

/** S-10 マイ構成（編集） */
export function MyStackEditor({ stack, catalog, addServiceId }: { stack: Stack; catalog: Catalog; addServiceId: string | null }) {
  const { profile } = stack;
  const [order, setOrder] = useState(stack.active.map((e) => e.sub.id));
  const [dialog, setDialog] = useState<DialogTarget | null>(addServiceId ? { kind: "new", serviceId: addServiceId } : null);
  const [toast, setToast] = useState<ActionState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();

  // サーバーから新しい一覧が届いたら並び順を合わせる
  const activeKey = stack.active.map((e) => e.sub.id).join();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- サーバーの並び順に合わせ直す
    setOrder(activeKey ? activeKey.split(",") : []);
  }, [activeKey]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = new Map(stack.active.map((e) => [e.sub.id, e]));
  const active = order.map((id) => byId.get(id)).filter((e): e is StackEntry => Boolean(e));
  const url = `${SITE_URL}/@${profile.handle}`;

  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      const r = await fn();
      setToast(r);
    });

  function move(ids: string[]) {
    setOrder(ids);
    run(() => reorder(ids));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
      <header className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar profile={profile} size="md" />
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold md:text-2xl">マイ構成の管理・編集</h1>
            <p className="truncate text-xs text-subtle">
              @{profile.handle}・最終更新 {new Date(profile.updatedAt).toLocaleDateString("ja-JP")}
            </p>
            <Link href="/settings" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-accent-strong hover:underline">
              <Settings className="size-3.5" aria-hidden />
              プロフィール・アカウント設定
            </Link>
          </div>
        </div>
        <div className="space-y-2">
          <div role="radiogroup" aria-label="公開範囲" className="grid grid-cols-3 rounded-xl bg-surface-3 p-1">
            {VISIBILITY_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={profile.visibility === id}
                title={VISIBILITY_OPTIONS.find((v) => v.id === id)?.help}
                onClick={() => profile.visibility !== id && run(() => setVisibility(id))}
                className={`flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold ${profile.visibility === id ? "bg-surface text-accent-strong shadow-sm" : "text-muted"}`}
              >
                <Icon className="size-3.5" aria-hidden />
                {label.replace("（自分のみ）", "")}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-line px-3 text-xs font-bold hover:border-accent"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "コピーしました" : "URLをコピー"}
            </button>
            {profile.visibility !== "private" && (
              <Link href={`/@${profile.handle}`} className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-accent px-3 text-xs font-bold text-on-accent hover:bg-accent-strong">
                公開ページを見る
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="サマリー">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-bold text-subtle">月額合計</p>
          <Price value={stack.monthlyTotal} size="lg" />
          <p className="mt-2 flex justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
            <span className="text-subtle">年間換算</span>
            <Price value={stack.monthlyTotal * 12} size="sm" unit="/年" />
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-bold text-subtle">契約数</p>
          <p className="mt-1 font-bold">
            <span className="num text-3xl font-extrabold">{stack.active.length}</span> 件契約中
            <span className="ml-3 text-subtle">
              <span className="num text-xl font-extrabold">{stack.cancelled.length}</span> 件解約
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="mb-3 text-xs font-bold text-subtle">カテゴリ別の内訳</p>
          {stack.categoryShares.length ? <CategoryBar shares={stack.categoryShares} /> : <p className="text-sm text-muted">まだありません。</p>}
        </div>
      </section>

      <section aria-labelledby="active">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 id="active" className="text-lg font-extrabold">
            契約中のサブスク <span className="num text-sm text-subtle">{active.length}件</span>
          </h2>
          <p className="hidden text-xs text-subtle md:block">ドラッグか矢印で並び替えられます</p>
        </div>
        <ul className="space-y-3">
          {active.map((e, i) => (
            <li
              key={e.sub.id}
              draggable
              onDragStart={() => setDragId(e.sub.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (!dragId || dragId === e.sub.id) return;
                const ids = order.filter((x) => x !== dragId);
                ids.splice(ids.indexOf(e.sub.id) + (order.indexOf(dragId) < i ? 1 : 0), 0, dragId);
                move(ids);
              }}
              className={`rounded-2xl border bg-surface p-4 ${dragId === e.sub.id ? "border-accent opacity-60" : "border-line"} ${e.sub.isHidden ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col items-center text-subtle">
                  <GripVertical className="hidden size-5 cursor-grab md:block" aria-hidden />
                  <button type="button" disabled={i === 0} onClick={() => move(swap(order, i, i - 1))} aria-label={`${e.service.name} を上へ`} className="flex size-8 items-center justify-center rounded disabled:opacity-30">
                    <ArrowUp className="size-4" />
                  </button>
                  <button type="button" disabled={i === active.length - 1} onClick={() => move(swap(order, i, i + 1))} aria-label={`${e.service.name} を下へ`} className="flex size-8 items-center justify-center rounded disabled:opacity-30">
                    <ArrowDown className="size-4" />
                  </button>
                </div>
                <ServiceLogo service={e.service} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold">
                        {e.service.name}
                        {e.sub.isHidden && <span className="ml-2 rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-subtle">非公開</span>}
                      </p>
                      <p className="text-xs text-subtle">{[e.service.company, e.plan && `${e.plan.name}プラン`].filter(Boolean).join("・")}</p>
                    </div>
                    <Price value={e.sub.monthlyPrice} size="md" />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {e.sub.satisfaction && <Stars value={e.sub.satisfaction} />}
                    {e.sub.tags.map((t) => (
                      <Tag key={t} name={t} />
                    ))}
                  </p>
                  {e.sub.comment && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">{e.sub.comment}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="mr-auto text-subtle">{e.sub.startedOn && `利用開始 ${yearMonth(e.sub.startedOn)}`}</span>
                    <button
                      type="button"
                      onClick={() => run(() => setHidden(e.sub.id, !e.sub.isHidden))}
                      className="flex min-h-9 items-center gap-1 rounded-lg px-2 font-bold text-muted hover:bg-surface-2"
                      aria-label={e.sub.isHidden ? `${e.service.name} を公開する` : `${e.service.name} を非公開にする`}
                    >
                      {e.sub.isHidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                      {e.sub.isHidden ? "非公開" : "公開"}
                    </button>
                    <button type="button" onClick={() => setDialog({ kind: "edit", sub: e.sub })} className="flex min-h-9 items-center gap-1 rounded-lg bg-surface-3 px-3 font-bold hover:bg-accent-soft">
                      <PencilLine className="size-4" aria-hidden />
                      編集
                    </button>
                    <button type="button" onClick={() => setDialog({ kind: "edit", sub: e.sub, status: "cancelled" })} className="min-h-9 rounded-lg px-3 font-bold text-like hover:bg-pr-soft">
                      解約済みにする
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setDialog({ kind: "new" })}
          className="mt-3 flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line text-accent-strong hover:border-accent"
        >
          <Plus className="size-6" aria-hidden />
          <span className="font-bold">新しいサブスクを追加する</span>
          <span className="text-xs text-subtle">サービスを検索して追加</span>
        </button>
      </section>

      {stack.cancelled.length > 0 && (
        <details open className="rounded-2xl border border-line bg-surface p-5">
          <summary className="flex cursor-pointer items-center gap-2 font-extrabold">
            <History className="size-5 text-subtle" aria-hidden />
            解約・見直し履歴 <span className="num text-sm text-subtle">{stack.cancelled.length}件</span>
          </summary>
          <ul className="mt-4 space-y-3">
            {stack.cancelled.map((e) => (
              <li key={e.sub.id} className="flex flex-wrap items-start gap-3 rounded-xl bg-surface-2 p-4">
                <ServiceLogo service={e.service} size="md" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold text-muted">
                    {e.service.name}
                    {e.sub.cancelledOn && <span className="ml-2 text-xs font-normal text-subtle">解約：{yearMonth(e.sub.cancelledOn)}</span>}
                  </p>
                  {e.sub.cancelReason && <p className="mt-1">理由：{e.sub.cancelReason}</p>}
                  {e.sub.cancelReasonDetail && <p className="text-muted">{e.sub.cancelReasonDetail}</p>}
                  {e.switchedTo && <p className="mt-1 text-xs font-bold text-accent-strong">→ 乗り換え先：{e.switchedTo.name}</p>}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <button type="button" onClick={() => setDialog({ kind: "edit", sub: e.sub })} className="min-h-9 rounded-lg px-2 font-bold text-muted hover:bg-surface">
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => confirm(`${e.service.name} を履歴から削除しますか？`) && run(() => deleteSubscription(e.sub.id))}
                    className="flex min-h-9 items-center gap-1 rounded-lg px-2 font-bold text-muted hover:bg-surface"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    履歴から削除
                  </button>
                  <button type="button" onClick={() => run(() => reactivate(e.sub.id))} className="flex min-h-9 items-center gap-1 rounded-lg bg-accent-soft px-3 font-bold text-accent-strong">
                    <RotateCcw className="size-3.5" aria-hidden />
                    再契約する
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      <button
        type="button"
        onClick={() => setDialog({ kind: "new" })}
        aria-label="サブスクを追加"
        className="fixed right-4 bottom-24 z-20 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg md:hidden"
      >
        <Plus className="size-7" />
      </button>

      {toast && (toast.error || toast.message) && (
        <p
          role={toast.error ? "alert" : "status"}
          className={`fixed inset-x-4 bottom-24 z-40 mx-auto max-w-md rounded-xl px-4 py-3 text-center text-sm font-bold shadow-lg md:bottom-8 ${toast.error ? "bg-danger text-white" : "bg-fg text-bg"}`}
        >
          {toast.error ?? toast.message}
        </p>
      )}

      {dialog && (
        <SubscriptionDialog
          key={dialog.kind === "edit" ? `${dialog.sub.id}-${dialog.status ?? ""}` : `new-${dialog.serviceId ?? ""}`}
          catalog={catalog}
          target={dialog}
          onClose={() => setDialog(null)}
          onDone={(message) => {
            setDialog(null);
            setToast({ ok: true, message });
          }}
        />
      )}
    </div>
  );
}

function swap(ids: string[], a: number, b: number): string[] {
  const next = [...ids];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
