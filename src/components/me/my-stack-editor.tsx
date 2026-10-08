"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { CATEGORY_COLORS } from "@/components/category-bar";
import { onPrimaryContainer } from "@/components/forms/field";
import { ServiceLogo } from "@/components/service-logo";
import { VISIBILITY_OPTIONS } from "@/components/visibility";
import type { ActionState } from "@/lib/actions/common";
import { setVisibility } from "@/lib/actions/profile";
import { deleteSubscription, reactivate, reorder, setHidden } from "@/lib/actions/subscriptions";
import type { Catalog } from "@/lib/catalog";
import { percent, SITE_URL, yearMonth, yen } from "@/lib/format";
import type { CategoryShare, Stack, StackEntry } from "@/lib/stacks";
import { SERVICE_SEARCH_ID, SubscriptionDialog, type DialogTarget } from "./subscription-dialog";

const icon = "material-symbols-outlined";
const card = "rounded-xl bg-surface-container-lowest shadow-sm";
const eyebrow = "font-label-sm text-label-sm tracking-wider text-outline uppercase";
const VISIBILITY_ICONS = { public: "public", unlisted: "link", private: "lock" } as const;

/** PC（xl 以上）では追加・編集パネルを右カラムに常に出す */
const WIDE = "(min-width: 1280px)";
function subscribeWide(cb: () => void) {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
function useWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

/** S-10 マイ構成（編集） */
export function MyStackEditor({ stack, catalog, addServiceId }: { stack: Stack; catalog: Catalog; addServiceId: string | null }) {
  const { profile } = stack;
  const [order, setOrder] = useState(stack.active.map((e) => e.sub.id));
  const [dialog, setDialog] = useState<DialogTarget | null>(addServiceId ? { kind: "new", serviceId: addServiceId } : null);
  const [panelKey, setPanelKey] = useState(0);
  const [toast, setToast] = useState<ActionState | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, start] = useTransition();
  const wide = useWide();

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
  const shortUrl = url.replace(/^https?:\/\//, "");
  const hiddenCount = stack.active.filter((e) => e.sub.isHidden).length;
  const topSpend = [...stack.active].sort((a, b) => b.sub.monthlyPrice - a.sub.monthlyPrice).slice(0, 3);
  const updated = new Date(profile.updatedAt).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" });

  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      const r = await fn();
      setToast(r);
    });

  function move(ids: string[]) {
    setOrder(ids);
    run(() => reorder(ids));
  }

  function openNew() {
    setDialog({ kind: "new" });
    if (wide) {
      setPanelKey((k) => k + 1);
      requestAnimationFrame(() => document.getElementById(SERVICE_SEARCH_ID)?.focus());
    }
  }

  function closeDialog() {
    setDialog(null);
    // PC のパネルは閉じずに「新規追加」に戻す
    setPanelKey((k) => k + 1);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const panelTarget: DialogTarget | null = wide ? (dialog ?? { kind: "new" }) : dialog;
  const panelId =
    panelTarget === null
      ? ""
      : panelTarget.kind === "edit"
        ? `${panelTarget.sub.id}-${panelTarget.status ?? ""}`
        : `new-${panelTarget.serviceId ?? ""}`;
  const panel = panelTarget && (
    <SubscriptionDialog
      key={`${wide ? "inline" : "modal"}-${panelId}-${panelKey}`}
      catalog={catalog}
      target={panelTarget}
      inline={wide}
      onClose={closeDialog}
      onDone={(message) => {
        closeDialog();
        setToast({ ok: true, message });
      }}
    />
  );

  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-20 size-96 rounded-full bg-primary-fixed/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-secondary-fixed-dim/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-space-md px-margin-mobile py-space-md sm:gap-space-lg sm:px-margin sm:py-space-xl">
        {/* 公開状態・共有 */}
        <section className={`${card} flex flex-col justify-between gap-3 p-space-md sm:p-space-lg lg:flex-row lg:items-center lg:gap-space-md`}>
          <div className="flex min-w-0 items-center gap-space-md">
            <span className="relative hidden shrink-0 sm:block">
              <Avatar profile={profile} size="md" />
            </span>
            <div className="min-w-0 space-y-space-xs">
              <h1 className="flex items-center gap-1.5 font-headline-sm text-headline-sm font-bold text-on-surface sm:font-headline-lg sm:text-headline-lg">
                <span className="size-2.5 shrink-0 rounded-full bg-secondary sm:hidden" aria-hidden />
                マイ構成の管理・編集
              </h1>
              <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className={`${icon} text-[16px] text-primary`} aria-hidden>
                    schedule
                  </span>
                  最終更新: {updated}
                </span>
                <span className="hidden text-outline-variant sm:inline" aria-hidden>
                  •
                </span>
                <span className="hidden truncate text-outline sm:inline">URL: /@{profile.handle}</span>
                <span className="hidden text-outline-variant sm:inline" aria-hidden>
                  •
                </span>
                <Link href="/settings" className="hidden items-center gap-1 font-bold text-primary hover:underline sm:inline-flex">
                  <span className={`${icon} text-[16px]`} aria-hidden>
                    settings
                  </span>
                  プロフィール・アカウント設定
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end lg:gap-space-sm">
            <div role="radiogroup" aria-label="公開範囲" className="flex items-center gap-1 rounded-xl bg-surface-container-low p-1 shadow-inner lg:rounded-lg">
              {VISIBILITY_OPTIONS.map(({ id, label, help }) => {
                const on = profile.visibility === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={help}
                    onClick={() => !on && run(() => setVisibility(id))}
                    className={`flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg px-2 font-label-md text-label-md transition-all lg:flex-none lg:px-3 ${on ? "bg-primary text-on-primary shadow-sm lg:bg-surface-container-lowest lg:text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
                  >
                    <span className={`${icon} text-[16px]`} aria-hidden>
                      {VISIBILITY_ICONS[id]}
                    </span>
                    <span className="truncate">{label.replace("（自分のみ）", "")}</span>
                    {id === "public" && <span className="hidden font-label-sm text-label-sm text-tertiary-container dark:text-tertiary lg:inline">推奨</span>}
                  </button>
                );
              })}
            </div>

            {/* スマートフォン：公開URLのバー */}
            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-2 lg:hidden">
              <span className="flex min-w-0 items-center gap-1.5 px-1">
                <span className={`${icon} shrink-0 text-[18px] text-primary`} aria-hidden>
                  alternate_email
                </span>
                <span className="truncate font-mono font-label-md text-label-md text-on-surface">{shortUrl}</span>
              </span>
              <button
                type="button"
                onClick={copyUrl}
                className={`flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 font-label-sm text-label-sm transition-all active:scale-95 ${copied ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-highest text-on-surface hover:bg-surface-container"}`}
              >
                <span className={`${icon} text-[15px]`} aria-hidden>
                  {copied ? "done" : "content_copy"}
                </span>
                {copied ? "コピーしました" : "コピー"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 lg:flex lg:items-center lg:gap-space-xs lg:pt-0">
              {profile.visibility !== "private" && (
                <Link
                  href={`/@${profile.handle}`}
                  className={`flex h-11 items-center justify-center gap-1 rounded-xl font-label-md text-label-md shadow-sm transition-all hover:bg-primary active:scale-[0.98] lg:order-2 lg:h-10 lg:rounded-lg lg:px-3.5 lg:font-headline-sm lg:text-headline-sm dark:hover:bg-primary-container dark:hover:brightness-110 ${onPrimaryContainer}`}
                >
                  公開ページを見る
                  <span className={`${icon} text-[16px]`} aria-hidden>
                    open_in_new
                  </span>
                </Link>
              )}
              <button
                type="button"
                onClick={copyUrl}
                className="hidden h-10 items-center gap-1 rounded-lg bg-surface-container px-3 font-headline-sm text-headline-sm text-on-surface transition-colors hover:bg-surface-container-high lg:order-1 lg:inline-flex"
              >
                <span className={`${icon} text-[18px]`} aria-hidden>
                  {copied ? "done" : "content_copy"}
                </span>
                {copied ? "コピーしました" : "URLをコピー"}
              </button>
              <Link
                href="/settings"
                className={`flex h-11 items-center justify-center gap-1 rounded-xl bg-surface-container-high font-label-md text-label-md text-on-surface transition-all active:scale-[0.98] sm:hidden ${profile.visibility === "private" ? "col-span-2" : ""}`}
              >
                <span className={`${icon} text-[18px] text-primary`} aria-hidden>
                  settings
                </span>
                プロフィール設定
              </Link>
            </div>
          </div>
        </section>

        {/* サマリー：スマートフォンは1枚にまとめる */}
        <section className={`${card} space-y-3 p-space-md md:hidden`} aria-label="サマリー">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-primary-fixed">合計コスト</span>
            {stack.cancelled.length > 0 && <span className="font-label-sm text-label-sm text-on-surface-variant">解約済み {stack.cancelled.length}件</span>}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="num font-price-xl text-price-xl font-extrabold tracking-tight text-on-surface">
                ¥{yen(stack.monthlyTotal)} <span className="font-headline-sm text-headline-sm font-normal text-on-surface-variant">/月</span>
              </p>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                年間想定: <span className="num font-semibold text-on-surface">¥{yen(stack.monthlyTotal * 12)}</span> /年
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 font-label-md text-label-md font-bold text-on-surface">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              {stack.active.length}件 契約中
            </span>
          </div>
          <ShareBar shares={stack.categoryShares} height="h-2.5" />
        </section>

        {/* サマリー：PC・タブレット */}
        <section className="hidden grid-cols-12 gap-gutter md:grid" aria-label="サマリー">
          <div className={`${card} relative col-span-4 flex flex-col justify-between overflow-hidden p-space-lg`}>
            <div className="pointer-events-none absolute -right-6 -bottom-6 size-32 rounded-full bg-primary-fixed/20" aria-hidden />
            <div>
              <div className="flex items-center justify-between">
                <span className={eyebrow}>Total monthly spend</span>
                <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-primary-fixed-variant">合計コスト</span>
              </div>
              <p className="mt-space-sm flex items-baseline gap-space-xs">
                <span className="num font-price-xl text-price-xl tracking-tight text-on-surface">¥{yen(stack.monthlyTotal)}</span>
                <span className="font-body-md text-body-md text-on-surface-variant">/ 月</span>
              </p>
            </div>
            <p className="relative mt-space-md flex items-center justify-between rounded-lg bg-surface-container-low px-space-md py-space-xs">
              <span className="font-label-md text-label-md text-on-surface-variant">年間想定コスト</span>
              <span className="num font-headline-sm text-headline-sm font-bold text-on-surface">
                ¥{yen(stack.monthlyTotal * 12)} <span className="font-body-sm text-body-sm font-normal text-outline">/年</span>
              </span>
            </p>
          </div>
          <div className={`${card} col-span-3 flex flex-col justify-between p-space-lg`}>
            <div>
              <span className={eyebrow}>Subscription count</span>
              <div className="mt-space-sm flex items-center gap-space-lg">
                <p>
                  <span className="num font-headline-lg text-headline-lg text-primary">{stack.active.length}</span>
                  <span className="ml-1 font-body-sm text-body-sm text-on-surface-variant">契約中</span>
                </p>
                <span className="h-8 w-px bg-surface-container" aria-hidden />
                <p>
                  <span className="num font-headline-lg text-headline-lg text-outline">{stack.cancelled.length}</span>
                  <span className="ml-1 font-body-sm text-body-sm text-on-surface-variant">解約済</span>
                </p>
              </div>
            </div>
            {hiddenCount > 0 && (
              <p className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <span className={`${icon} text-[18px] text-tertiary`} aria-hidden>
                  visibility_off
                </span>
                うち {hiddenCount}件は公開ページに出していません
              </p>
            )}
          </div>
          <div className={`${card} col-span-5 flex flex-col justify-between p-space-lg`}>
            <div className="flex items-center justify-between">
              <span className={eyebrow}>Category distribution</span>
              {stack.categoryShares[0] && (
                <span className="font-label-sm text-label-sm font-semibold text-primary">{stack.categoryShares[0].category.name}が最多</span>
              )}
            </div>
            <div className="mt-space-sm">
              {stack.categoryShares.length ? (
                <ShareBar shares={stack.categoryShares} height="h-3" />
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant">まだありません。</p>
              )}
            </div>
            {topSpend.length > 0 && (
              <p className="truncate pt-space-xs font-body-sm text-body-sm text-outline">主な支出: {topSpend.map((e) => e.service.name).join(", ")}</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-gutter xl:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-space-md xl:col-span-7">
            <section className="flex flex-col gap-2.5 sm:gap-space-md" aria-labelledby="active">
              <div className="flex items-center justify-between px-1 sm:px-0">
                <div className="flex items-center gap-space-xs">
                  <span className={`${icon} hidden text-[22px] text-primary sm:inline`} aria-hidden>
                    view_agenda
                  </span>
                  <h2 id="active" className="font-headline-sm text-headline-sm font-bold text-on-surface sm:font-headline-md sm:text-headline-md">
                    契約中サブスク一覧
                  </h2>
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm text-on-primary-fixed-variant">{active.length}件</span>
                </div>
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant sm:font-body-sm sm:text-body-sm sm:text-outline">
                  <span className={`${icon} text-[15px] sm:hidden`} aria-hidden>
                    swap_vert
                  </span>
                  <span className="sm:hidden">矢印で並び替え</span>
                  <span className="hidden sm:inline">ドラッグか矢印で表示順を変更できます</span>
                </span>
              </div>

              <ul className="flex flex-col gap-2.5 sm:gap-space-sm">
                {active.map((e, i) => {
                  const arrows = (
                    <>
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => move(swap(order, i, i - 1))}
                          aria-label={`${e.service.name} を上へ`}
                          className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                        >
                          <span className={`${icon} text-[18px]`} aria-hidden>
                            arrow_upward
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={i === active.length - 1}
                          onClick={() => move(swap(order, i, i + 1))}
                          aria-label={`${e.service.name} を下へ`}
                          className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                        >
                          <span className={`${icon} text-[18px]`} aria-hidden>
                            arrow_downward
                          </span>
                        </button>
                    </>
                  );
                  return (
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
                    className={`group relative flex flex-col gap-2.5 rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm transition-all hover:shadow-md sm:gap-space-sm sm:rounded-xl sm:p-space-lg ${dragId === e.sub.id ? "opacity-60 ring-2 ring-primary-container" : ""}`}
                  >
                    <div className={`flex items-start justify-between gap-2 sm:gap-space-sm ${e.sub.isHidden ? "opacity-60" : ""}`}>
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-space-sm">
                        <span className={`${icon} hidden shrink-0 cursor-grab text-[20px] text-outline select-none active:cursor-grabbing sm:inline-block`} title="ドラッグで並び替え" aria-hidden>
                          drag_indicator
                        </span>
                        <span className="-my-1 -ml-1 flex flex-col sm:hidden">{arrows}</span>
                        <span className="hidden sm:inline-flex">
                          <ServiceLogo service={e.service} size="lg" />
                        </span>
                        <span className="inline-flex sm:hidden">
                          <ServiceLogo service={e.service} size="md" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:gap-x-space-xs">
                            <h3 className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">{e.service.name}</h3>
                            {e.plan && (
                              <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm font-semibold text-on-surface sm:px-2 sm:text-on-surface-variant">
                                {e.plan.name}
                              </span>
                            )}
                            {e.sub.satisfaction && (
                              <span className="hidden sm:inline-flex">
                                <Rating value={e.sub.satisfaction} />
                              </span>
                            )}
                            {e.sub.isHidden && (
                              <span className="rounded bg-tertiary-fixed px-1.5 py-0.5 font-label-sm text-label-sm text-on-tertiary-fixed-variant">非公開</span>
                            )}
                          </div>
                          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                            {[e.service.company, e.plan ? (e.plan.billingCycle === "yearly" ? "年払い月換算" : "月次更新") : null].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num font-price-md text-price-md font-bold text-on-surface sm:font-price-lg sm:text-price-lg">
                          ¥{yen(e.sub.monthlyPrice)}
                          <span className="ml-0.5 font-body-sm text-body-sm font-normal text-on-surface-variant sm:hidden">/月</span>
                        </p>
                        <p className="hidden font-body-sm text-body-sm text-outline sm:block">/ 月</p>
                        {e.sub.satisfaction && (
                          <span className="inline-flex sm:hidden">
                            <Rating value={e.sub.satisfaction} />
                          </span>
                        )}
                      </div>
                    </div>

                    {(e.sub.tags.length > 0 || e.sub.comment) && (
                      <div className={`space-y-2.5 sm:space-y-space-xs sm:pl-10 ${e.sub.isHidden ? "opacity-60" : ""}`}>
                        {e.sub.tags.length > 0 && (
                          <ul className="flex flex-wrap gap-1 sm:gap-1.5">
                            {e.sub.tags.map((t) => (
                              <li key={t} className="rounded-full bg-surface-container-low px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant sm:bg-surface-container">
                                #{t}
                              </li>
                            ))}
                          </ul>
                        )}
                        {e.sub.comment && (
                          <p className="rounded-xl bg-surface-container-low p-2.5 font-body-sm text-body-sm leading-relaxed text-on-surface sm:rounded-lg sm:bg-surface-container-low/70 sm:text-on-surface-variant">
                            「{e.sub.comment}」
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1 font-label-sm text-label-sm text-on-surface-variant sm:pt-space-xs">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <span className="hidden items-center gap-1 sm:flex">{arrows}</span>
                        {e.sub.startedOn && <span className="ml-1 text-outline">開始: {yearMonth(e.sub.startedOn)}</span>}
                      </span>
                      <span className="ml-auto flex items-center gap-1 sm:gap-space-xs">
                        <button
                          type="button"
                          onClick={() => run(() => setHidden(e.sub.id, !e.sub.isHidden))}
                          className="flex min-h-9 items-center gap-0.5 rounded-lg px-1.5 hover:bg-surface-container hover:text-on-surface"
                          aria-label={e.sub.isHidden ? `${e.service.name} を公開する` : `${e.service.name} を非公開にする`}
                          title="公開表示の切り替え"
                        >
                          <span className={`${icon} text-[18px]`} aria-hidden>
                            {e.sub.isHidden ? "visibility_off" : "visibility"}
                          </span>
                          <span className="hidden sm:inline">{e.sub.isHidden ? "非公開" : "公開"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "edit", sub: e.sub })}
                          className="flex min-h-9 items-center gap-0.5 rounded-lg px-1.5 font-bold text-primary transition-colors sm:bg-surface-container sm:px-2.5 sm:font-label-md sm:text-label-md sm:text-on-surface sm:hover:bg-surface-container-high"
                        >
                          <span className={`${icon} text-[16px]`} aria-hidden>
                            edit
                          </span>
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "edit", sub: e.sub, status: "cancelled" })}
                          className="min-h-9 rounded-lg px-1.5 font-semibold text-tertiary transition-colors hover:bg-tertiary-fixed sm:px-2.5 sm:font-label-md sm:text-label-md"
                        >
                          解約済みにする
                        </button>
                      </span>
                    </div>
                  </li>
                  );
                })}
              </ul>

              {active.length === 0 && (
                <p className={`${card} p-space-lg text-center font-body-md text-body-md text-on-surface-variant`}>まだサブスクが登録されていません。</p>
              )}

              <button
                type="button"
                onClick={openNew}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container-low px-4 py-3.5 text-primary shadow-sm transition-all hover:bg-surface-container active:scale-[0.99] sm:flex-col sm:gap-space-xs sm:rounded-xl sm:py-space-lg sm:shadow-inner"
              >
                <span className={`${icon} text-[22px] sm:hidden`} aria-hidden>
                  add_circle
                </span>
                <span className="hidden size-10 items-center justify-center rounded-full bg-primary-fixed transition-transform group-hover:scale-110 sm:flex">
                  <span className={`${icon} text-[24px] text-on-primary-fixed-variant`} aria-hidden>
                    add
                  </span>
                </span>
                <span className="font-headline-sm text-headline-sm font-bold">新しいサブスクを追加する</span>
                <span className="hidden font-body-sm text-body-sm text-on-surface-variant sm:block">サービスを検索して追加</span>
              </button>
            </section>

            {stack.cancelled.length > 0 && (
              <details open className={`${card} group overflow-hidden rounded-2xl sm:mt-space-md sm:rounded-xl`}>
                <summary className="flex cursor-pointer list-none items-center justify-between bg-surface-container-low/50 p-space-md transition-colors select-none hover:bg-surface-container-low sm:p-space-lg [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-space-sm">
                    <span className={`${icon} text-[20px] text-outline`} aria-hidden>
                      history
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">解約・見直し履歴</span>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-outline">{stack.cancelled.length}件</span>
                  </span>
                  <span className={`${icon} text-outline transition-transform group-open:rotate-180`} aria-hidden>
                    expand_more
                  </span>
                </summary>
                <ul className="flex flex-col gap-3 p-space-md sm:gap-space-md sm:p-space-lg">
                  {stack.cancelled.map((e) => (
                    <li key={e.sub.id} className="flex flex-col justify-between gap-3 rounded-xl bg-surface-container-low p-3 sm:flex-row sm:items-center sm:gap-space-md sm:p-space-md">
                      <div className="flex min-w-0 items-start gap-space-sm">
                        <span className="opacity-70 grayscale">
                          <ServiceLogo service={e.service} size="md" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-space-xs">
                            <span className="font-headline-sm text-headline-sm text-on-surface line-through opacity-70">{e.service.name}</span>
                            {e.sub.cancelledOn && (
                              <span className="rounded bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-outline">解約: {yearMonth(e.sub.cancelledOn)}</span>
                            )}
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">当時 ¥{yen(e.sub.monthlyPrice)}/月</p>
                          {(e.sub.cancelReason || e.sub.cancelReasonDetail) && (
                            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                              <strong className="text-on-surface">解約理由:</strong> {[e.sub.cancelReason, e.sub.cancelReasonDetail].filter(Boolean).join("／")}
                            </p>
                          )}
                          {e.switchedTo && (
                            <p className="mt-1 flex items-center gap-1 font-label-sm text-label-sm text-primary">
                              <span className={`${icon} text-[14px]`} aria-hidden>
                                arrow_right_alt
                              </span>
                              乗り換え先: {e.switchedTo.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-space-xs self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setDialog({ kind: "edit", sub: e.sub })}
                          className="min-h-9 rounded-lg px-2.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => confirm(`${e.service.name} を履歴から削除しますか？`) && run(() => deleteSubscription(e.sub.id))}
                          className="min-h-9 rounded-lg px-2.5 font-label-md text-label-md text-outline transition-colors hover:bg-error-container/40 hover:text-error"
                        >
                          履歴から削除
                        </button>
                        <button
                          type="button"
                          onClick={() => run(() => reactivate(e.sub.id))}
                          className="min-h-9 rounded-lg bg-primary-fixed px-3 font-label-md text-label-md font-bold text-on-primary-fixed-variant transition-colors hover:bg-primary-fixed-dim"
                        >
                          再契約する
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* PC：右カラムの追加・編集パネル（S-11） */}
          {wide && <div className="xl:sticky xl:top-20 xl:col-span-5">{panel}</div>}
        </div>
      </div>

      <button
        type="button"
        onClick={openNew}
        aria-label="サブスクを追加"
        className={`fixed right-4 bottom-24 z-20 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 md:hidden ${onPrimaryContainer}`}
      >
        <span className={`${icon} text-[28px]`} aria-hidden>
          add
        </span>
      </button>

      {toast && (toast.error || toast.message) && (
        <p
          role={toast.error ? "alert" : "status"}
          className={`fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl px-4 py-3 text-center font-label-md text-label-md font-bold shadow-lg md:bottom-8 ${toast.error ? "bg-error-container text-on-error-container" : "bg-inverse-surface text-inverse-on-surface"}`}
        >
          <span className={`${icon} text-[18px]`} aria-hidden>
            {toast.error ? "error" : "check_circle"}
          </span>
          {toast.error ?? toast.message}
        </p>
      )}

      {!wide && panel}
    </div>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center justify-end gap-0.5 font-label-sm text-label-sm font-bold text-amber-500 dark:text-amber-400" aria-label={`満足度 ${value} / 5`}>
      <span className="material-symbols-outlined fill text-[14px]" aria-hidden>
        star
      </span>
      {value}.0
    </span>
  );
}

function ShareBar({ shares, height }: { shares: CategoryShare[]; height: string }) {
  if (shares.length === 0) return null;
  return (
    <div className="space-y-1.5 pt-1">
      <div className={`flex w-full overflow-hidden rounded-full bg-surface-container ${height}`} role="img" aria-label="カテゴリ別の内訳">
        {shares.map((s) => (
          <span
            key={s.category.id}
            className="h-full"
            title={`${s.category.name}: ${percent(s.ratio)}`}
            style={{ width: `${s.ratio * 100}%`, background: CATEGORY_COLORS[s.category.slug] ?? CATEGORY_COLORS.other }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-0.5 font-label-sm text-label-sm text-on-surface-variant">
        {shares.map((s) => (
          <li key={s.category.id} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: CATEGORY_COLORS[s.category.slug] ?? CATEGORY_COLORS.other }} aria-hidden />
            {s.category.name} {percent(s.ratio)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function swap(ids: string[], a: number, b: number): string[] {
  const next = [...ids];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
