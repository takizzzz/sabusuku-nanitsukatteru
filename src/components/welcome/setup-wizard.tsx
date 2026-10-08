"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { VISIBILITY_OPTIONS } from "@/components/visibility";
import { CATEGORY_COLORS } from "@/components/category-bar";
import { DemoNotice } from "@/components/demo-notice";
import { Field, FormMessage, inputCls, inputShellCls, onPrimaryContainer, primaryBtn, secondaryBtn } from "@/components/forms/field";
import { ServicePicker } from "@/components/forms/service-picker";
import { StarInput } from "@/components/forms/star-input";
import { TagInput } from "@/components/forms/tag-input";
import { ServiceLogo } from "@/components/service-logo";
import { ShareButtons } from "@/components/share-buttons";
import { completeOnboarding, type OnboardingResult } from "@/lib/actions/subscriptions";
import { monthlyOfPlan, type Catalog } from "@/lib/catalog";
import { percent, SITE_NAME, SITE_URL, yen } from "@/lib/format";
import { AGE_RANGES, COMMENT_MAX, DISPLAY_NAME_MAX, HANDLE_PATTERN, OCCUPATIONS } from "@/lib/options";
import type { Visibility } from "@/lib/types";

type Item = {
  serviceId: string;
  planId: string | null;
  monthlyPrice: string;
  satisfaction: number | null;
  tags: string[];
  comment: string;
};

type Draft = {
  step: 1 | 2 | 3;
  displayName: string;
  handle: string;
  occupation: string | null;
  ageRange: string | null;
  items: Item[];
  visibility: Visibility;
};

const STEPS = ["基本情報", "サブスク選択", "プラン＆使い分け"] as const;
const DRAFT_KEY = "sabusuku:welcome-draft";

/** カードの面（デザイン：白い面＋薄い影、角丸 xl） */
const card = "rounded-xl bg-surface-container-lowest shadow-sm";
const eyebrow = "font-label-sm text-label-sm tracking-wider text-outline uppercase";
const icon = "material-symbols-outlined";

export function SetupWizard({
  catalog,
  initial,
  preselect,
  demo,
}: {
  catalog: Catalog;
  initial: { displayName: string; handle: string };
  preselect: string | null;
  demo: boolean;
}) {
  const serviceById = useMemo(() => new Map(catalog.services.map((s) => [s.id, s])), [catalog.services]);
  const categoryById = useMemo(() => new Map(catalog.categories.map((c) => [c.id, c])), [catalog.categories]);
  const plansOf = (id: string) => catalog.plans.filter((p) => p.serviceId === id);
  const newItem = (serviceId: string): Item => {
    const plan = plansOf(serviceId)[0] ?? null;
    return { serviceId, planId: plan?.id ?? null, monthlyPrice: plan ? String(monthlyOfPlan(plan)) : "", satisfaction: null, tags: [], comment: "" };
  };

  const [d, setD] = useState<Draft>(() => {
    const pre = preselect ? catalog.services.find((s) => s.slug === preselect) : undefined;
    return { step: 1, ...initial, occupation: null, ageRange: null, items: pre ? [newItem(pre.id)] : [], visibility: "public" };
  });
  const [restored, setRestored] = useState(false);
  const [result, setResult] = useState<OnboardingResult>({});
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const setItem = (id: string, patch: Partial<Item>) =>
    setD((x) => ({ ...x, items: x.items.map((i) => (i.serviceId === id ? { ...i, ...patch } : i)) }));
  const removeItem = (id: string) => setD((x) => ({ ...x, items: x.items.filter((i) => i.serviceId !== id) }));
  const go = (step: Draft["step"]) => {
    set({ step });
    window.scrollTo({ top: 0 });
  };

  // 下書きをこの端末に残す
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Draft;
        const items = saved.items.filter((i) => serviceById.has(i.serviceId));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 保存済みの下書きを一度だけ復元する
        setD((x) => ({ ...saved, items: [...items, ...x.items.filter((i) => !items.some((s) => s.serviceId === i.serviceId))] }));
      }
    } catch {}
    setRestored(true);
  }, [serviceById]);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [d, restored]);

  const total = d.items.reduce((s, i) => s + (Number(i.monthlyPrice) || 0), 0);
  const shares = useMemo(() => {
    const m = new Map<number, number>();
    for (const i of d.items) {
      const s = serviceById.get(i.serviceId);
      if (s) m.set(s.categoryId, (m.get(s.categoryId) ?? 0) + (Number(i.monthlyPrice) || 0));
    }
    return catalog.categories
      .filter((c) => m.get(c.id))
      .map((c) => ({ c, amount: m.get(c.id)!, ratio: total ? m.get(c.id)! / total : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [d.items, serviceById, catalog.categories, total]);

  const fields = result.fields ?? {};
  const step1Error =
    !d.displayName.trim()
      ? "表示名を入力してください。"
      : d.displayName.length > DISPLAY_NAME_MAX
        ? `表示名は${DISPLAY_NAME_MAX}文字までです。`
        : !HANDLE_PATTERN.test(d.handle)
          ? "ユーザーIDは半角英小文字・数字・_ の3〜20文字です。"
          : null;

  function publish() {
    start(async () => {
      const r = await completeOnboarding({
        profile: { displayName: d.displayName.trim(), handle: d.handle, occupation: d.occupation, ageRange: d.ageRange },
        visibility: d.visibility,
        items: d.items.map((i) => ({
          serviceId: i.serviceId,
          planId: i.planId,
          monthlyPrice: i.monthlyPrice === "" ? null : Number(i.monthlyPrice),
          satisfaction: i.satisfaction,
          tags: i.tags,
          comment: i.comment.trim() || null,
          startedOn: null,
        })),
      });
      setResult(r);
      if (r.step) set({ step: r.step as Draft["step"] });
      if (r.ok && r.handle) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setDone(r.handle);
        window.scrollTo({ top: 0 });
      }
    });
  }

  if (done) return <Done handle={done} total={total} visibility={d.visibility} />;

  const selectedChips = d.items.length > 0 && (
    <ul className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1" aria-label="選択中のサブスク">
      {d.items.map((i) => {
        const s = serviceById.get(i.serviceId)!;
        return (
          <li
            key={i.serviceId}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 py-1.5 font-body-sm text-body-sm text-on-surface shadow-sm"
          >
            <span className="size-2 rounded-full" style={{ background: s.brandColor ?? CATEGORY_COLORS.other }} aria-hidden />
            {s.name}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-margin-mobile pt-4 pb-24 md:px-margin">
      {/* ステッパー */}
      <header className={`${card} mb-space-lg w-full p-space-md md:p-space-lg`}>
        <div className="mb-space-md flex flex-col justify-between gap-space-sm md:flex-row md:items-center md:gap-space-md">
          <div>
            <p className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed-variant">
              <span className={`${icon} text-[14px]`} aria-hidden>
                timer
              </span>
              あと少しで、あなたのサブスク構成ページができます
            </p>
            <h1 className="font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg">構成のセットアップ</h1>
          </div>
          <p className="inline-flex items-center gap-1 font-label-md text-label-md text-primary md:font-headline-sm md:text-headline-sm">
            <span className={`${icon} text-[18px]`} aria-hidden>
              verified
            </span>
            この端末に下書きを自動保存中
          </p>
        </div>
        <ol className="grid grid-cols-3 gap-space-xs md:gap-space-md">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Draft["step"];
            const state = d.step > n ? "done" : d.step === n ? "now" : "todo";
            return (
              <li key={label} className="min-w-0">
                <button
                  type="button"
                  disabled={n > d.step}
                  onClick={() => go(n)}
                  aria-current={state === "now" ? "step" : undefined}
                  className={`flex h-full w-full flex-col items-start gap-space-xs rounded-lg p-space-sm text-left transition-all sm:flex-row sm:items-center sm:gap-space-sm md:p-space-md ${state === "now" ? "bg-primary-fixed/40 shadow-sm" : "bg-surface-container-low"} ${state === "done" ? "hover:bg-surface-container" : ""}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-label-md text-label-md shadow-sm ${
                      state === "done"
                        ? "bg-primary text-on-primary"
                        : state === "now"
                          ? `${onPrimaryContainer} ring-4 ring-primary-fixed`
                          : "bg-surface-container-high text-on-surface-variant shadow-none"
                    }`}
                  >
                    {state === "done" ? (
                      <span className={`${icon} text-[18px]`} aria-label="完了">
                        check
                      </span>
                    ) : (
                      n
                    )}
                  </span>
                  <span className="min-w-0 max-w-full">
                    <span className="flex flex-wrap items-center gap-1 font-label-sm text-label-sm font-bold tracking-wider text-primary">
                      <span>Step {n}</span>
                      {state === "now" && <span className="hidden md:inline">・ 入力中</span>}
                      {n === 2 && d.items.length > 0 && (
                        <span className={`hidden rounded-full px-1.5 text-[10px] md:inline ${onPrimaryContainer}`}>{d.items.length}件選択中</span>
                      )}
                    </span>
                    <span
                      className={`block truncate font-label-md text-label-md md:font-headline-sm md:text-headline-sm ${state === "now" ? "text-primary" : state === "todo" ? "text-on-surface-variant" : "text-on-surface"}`}
                    >
                      {label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {demo && (
          <div className="mt-space-md">
            <DemoNotice>デモ表示中です。入力の流れは試せますが、最後の公開は保存されません。</DemoNotice>
          </div>
        )}
      </header>

      {d.step === 1 && (
        <section className={`${card} mx-auto flex max-w-2xl flex-col gap-space-lg p-space-md md:p-space-lg`} aria-labelledby="s1">
          <div>
            <p className={eyebrow}>Profile</p>
            <h2 id="s1" className="font-headline-md text-headline-md text-on-surface">
              あなたについて
            </h2>
          </div>
          <Field label="表示名" htmlFor="displayName" required error={fields.displayName} counter={{ value: d.displayName.length, max: DISPLAY_NAME_MAX }}>
            <input id="displayName" value={d.displayName} onChange={(e) => set({ displayName: e.target.value })} className={inputCls} placeholder="例：けんじ" />
          </Field>
          <Field
            label="ユーザーID（公開URL）"
            htmlFor="handle"
            required
            error={fields.handle}
            hint={`公開ページは ${SITE_URL.replace(/^https?:\/\//, "")}/@${d.handle || "your_id"} になります。半角英小文字・数字・_ の3〜20文字。`}
          >
            <div className={inputShellCls}>
              <span className="pl-3 font-headline-sm text-headline-sm text-on-surface-variant">@</span>
              <input
                id="handle"
                value={d.handle}
                onChange={(e) => set({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) })}
                className="min-h-11 min-w-0 flex-1 bg-transparent px-1 font-body-md text-base outline-none placeholder:text-outline md:text-body-md"
                placeholder="kenji_dev"
                autoCapitalize="off"
              />
            </div>
          </Field>
          <ChoiceChips label="職種" options={OCCUPATIONS} value={d.occupation} onChange={(v) => set({ occupation: v })} />
          <ChoiceChips label="年代" options={AGE_RANGES} value={d.ageRange} onChange={(v) => set({ ageRange: v })} />
          <p className="rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">
            職種と年代は任意です。入れておくと、似た人の構成を探すときに見つけてもらいやすくなります。
          </p>
          {step1Error && (d.displayName || d.handle) && <p className="font-label-md text-label-md text-error">{step1Error}</p>}
          <div className="flex justify-end">
            <button type="button" className={`${primaryBtn} w-full sm:w-auto`} disabled={!!step1Error} onClick={() => go(2)}>
              次へ：サブスクを選ぶ
              <span className={`${icon} text-[20px]`} aria-hidden>
                arrow_forward
              </span>
            </button>
          </div>
        </section>
      )}

      {d.step === 2 && (
        <section className={`${card} flex flex-col gap-space-md p-space-md md:p-space-lg`} aria-labelledby="s2">
          <div className="flex flex-wrap items-end justify-between gap-space-sm">
            <div>
              <p className={eyebrow}>Pick your stack</p>
              <h2 id="s2" className="font-headline-md text-headline-md text-on-surface">
                使っているサブスクをタップ
              </h2>
            </div>
            <p className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm ${onPrimaryContainer}`}>
              <span className="num">{d.items.length}</span>件選択中
            </p>
          </div>
          {selectedChips}
          <ServicePicker
            catalog={catalog}
            multiple
            selected={d.items.map((i) => i.serviceId)}
            onToggle={(s) =>
              setD((x) => ({
                ...x,
                items: x.items.some((i) => i.serviceId === s.id) ? x.items.filter((i) => i.serviceId !== s.id) : [...x.items, newItem(s.id)],
              }))
            }
          />
          <div className="flex items-center justify-between gap-space-sm pt-space-xs">
            <button type="button" className={secondaryBtn} onClick={() => go(1)}>
              <span className={`${icon} text-[18px]`} aria-hidden>
                arrow_back
              </span>
              戻る
            </button>
            <button type="button" className={primaryBtn} disabled={d.items.length === 0} onClick={() => go(3)}>
              次へ：プランを入力
              <span className={`${icon} text-[20px]`} aria-hidden>
                arrow_forward
              </span>
            </button>
          </div>
        </section>
      )}

      {d.step === 3 && (
        <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
          <section className="flex min-w-0 flex-col gap-space-md lg:col-span-7" aria-labelledby="s3">
            <div className={`${card} flex flex-col justify-between gap-space-sm p-space-md sm:flex-row sm:items-center`}>
              <div>
                <p className={eyebrow}>Stack details</p>
                <h2 id="s3" className="flex items-center gap-space-xs font-headline-md text-headline-md text-on-surface">
                  選択中のサブスク
                  <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${onPrimaryContainer}`}>{d.items.length} サービス</span>
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-surface-container px-space-md font-headline-sm text-headline-sm text-primary transition-colors hover:bg-surface-container-high"
                onClick={() => go(2)}
              >
                <span className={`${icon} text-[18px]`} aria-hidden>
                  add_circle
                </span>
                サービスを追加
              </button>
            </div>
            {selectedChips}
            {d.items.map((item) => {
              const s = serviceById.get(item.serviceId)!;
              const plans = plansOf(s.id);
              const yearly = plans.find((p) => p.id === item.planId)?.billingCycle === "yearly";
              return (
                <article key={s.id} className={`${card} p-space-md transition-shadow hover:shadow-md md:p-space-lg`}>
                  <div className="mb-space-md flex items-start justify-between gap-space-md">
                    <div className="flex min-w-0 items-center gap-space-sm">
                      <ServiceLogo service={s} size="lg" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-space-xs">
                          <h3 className="font-headline-md text-headline-md text-on-surface">{s.name}</h3>
                          {categoryById.get(s.categoryId) && (
                            <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                              {categoryById.get(s.categoryId)!.name}
                            </span>
                          )}
                        </div>
                        {s.company && <p className="font-body-sm text-body-sm text-outline">{s.company}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`${s.name} を外す`}
                      onClick={() => removeItem(s.id)}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-outline transition-colors hover:bg-error-container/40 hover:text-error"
                    >
                      <span className={`${icon} text-[20px]`} aria-hidden>
                        delete
                      </span>
                    </button>
                  </div>

                  <div className="mb-space-md grid grid-cols-1 gap-space-md md:grid-cols-2">
                    <PlanSelect
                      id={`plan-${s.id}`}
                      plans={plans}
                      value={item.planId}
                      onChange={(planId) => {
                        const plan = plans.find((p) => p.id === planId);
                        setItem(s.id, { planId: plan?.id ?? null, monthlyPrice: plan ? String(monthlyOfPlan(plan)) : item.monthlyPrice });
                      }}
                    />
                    <PriceInput
                      id={`price-${s.id}`}
                      value={item.monthlyPrice}
                      onChange={(v) => setItem(s.id, { monthlyPrice: v })}
                      hint={yearly ? "年額プランを12で割った額です" : "プランから自動入力。実際の金額に直せます"}
                    />
                  </div>

                  <div className="mb-space-md">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-label-md text-label-md font-bold text-on-surface">何に使ってる？（用途タグ）</span>
                      <span className="font-label-sm text-label-sm text-outline">複数選択可</span>
                    </div>
                    <TagInput value={item.tags} onChange={(tags) => setItem(s.id, { tags })} suggestions={[...s.tags, ...catalog.popularTags]} />
                  </div>

                  <div className="rounded-lg bg-surface-container-low/50 p-space-sm">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-space-xs">
                      <span className="font-label-md text-label-md font-bold text-on-surface">満足度</span>
                      <StarInput value={item.satisfaction} onChange={(v) => setItem(s.id, { satisfaction: v })} label={`${s.name} の満足度`} />
                    </div>
                    <div className="relative">
                      <label htmlFor={`c-${s.id}`} className="sr-only">
                        使い方コメント（任意）
                      </label>
                      <textarea
                        id={`c-${s.id}`}
                        rows={3}
                        value={item.comment}
                        onChange={(e) => setItem(s.id, { comment: e.target.value })}
                        placeholder="使い分けや手放せない理由をメモ（みんなの参考になります）"
                        className="w-full resize-none rounded-lg bg-surface-container-lowest p-2.5 pb-6 font-body-sm text-base text-on-surface transition-all outline-none placeholder:text-outline focus:ring-2 focus:ring-primary/20 md:text-body-sm"
                      />
                      <span
                        className={`num pointer-events-none absolute right-2 bottom-2.5 font-label-sm text-label-sm ${item.comment.length > COMMENT_MAX ? "text-error" : "text-outline"}`}
                      >
                        {item.comment.length} / {COMMENT_MAX}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
            {d.items.length === 0 && (
              <p className={`${card} p-space-lg text-center font-body-md text-body-md text-on-surface-variant`}>
                サブスクが選ばれていません。
                <button type="button" className="ml-1 font-bold text-primary hover:underline" onClick={() => go(2)}>
                  ステップ2で選ぶ
                </button>
              </p>
            )}
          </section>

          <aside className="flex flex-col gap-space-md lg:sticky lg:top-20 lg:col-span-5">
            <section className={`${card} p-space-md`} aria-label="構成サマリー">
              <div className="mb-space-sm flex items-center justify-between">
                <span className={`${eyebrow} font-bold`}>構成サマリー</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm text-on-secondary-fixed-variant">
                  <span className="size-1.5 animate-pulse rounded-full bg-secondary" aria-hidden />
                  入力に合わせて更新
                </span>
              </div>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">月額合計</span>
                <p className="text-right">
                  <span className="num font-price-xl text-price-xl font-extrabold tracking-tight text-primary">¥{yen(total)}</span>
                  <span className="font-label-md text-label-md text-outline">/月</span>
                </p>
              </div>
              <p className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">
                <span>年間換算コスト</span>
                <span className="num font-headline-sm text-headline-sm text-on-surface">
                  ¥{yen(total * 12)} <span className="font-body-sm text-body-sm text-outline">/年</span>
                </span>
              </p>
              {shares.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between font-label-sm text-label-sm text-outline">
                    <span>内訳比率</span>
                    <span>
                      {shares[0].c.name} {percent(shares[0].ratio)}
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container" role="img" aria-label="カテゴリ別の内訳">
                    {shares.map((x) => (
                      <span
                        key={x.c.id}
                        className="h-full"
                        title={`${x.c.name}: ${percent(x.ratio)}`}
                        style={{ width: `${x.ratio * 100}%`, background: CATEGORY_COLORS[x.c.slug] ?? CATEGORY_COLORS.other }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className={`${card} p-space-md`} aria-labelledby="ogp">
              <div className="mb-space-sm flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`${icon} text-[18px] text-primary`} aria-hidden>
                    share
                  </span>
                  <h3 id="ogp" className="font-headline-sm text-headline-sm text-on-surface">
                    シェア画像のイメージ
                  </h3>
                </div>
                <span className="font-label-sm text-label-sm text-outline">X・LINE で共有</span>
              </div>
              <div className="relative flex aspect-[1.91/1] w-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-inverse-surface p-4 text-on-primary shadow-md dark:from-primary-fixed-dim dark:to-surface-container-high dark:text-on-primary-container">
                <div className="pointer-events-none absolute -right-8 -bottom-8 size-44 rounded-full bg-secondary-container/20 blur-2xl" aria-hidden />
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest font-headline-sm text-headline-sm font-bold text-primary shadow">
                      {[...(d.displayName.trim() || d.handle || "?")][0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-headline-sm text-headline-sm leading-tight">@{d.handle || "your_id"}</p>
                      {(d.occupation || d.ageRange) && (
                        <p className="truncate font-label-sm text-label-sm text-on-primary-container">{[d.occupation, d.ageRange].filter(Boolean).join(" / ")}</p>
                      )}
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-surface-container-lowest/20 px-2 py-0.5 text-[11px] font-bold tracking-wider sm:inline">
                    {SITE_NAME}
                  </span>
                </div>
                <div className="relative z-10 my-auto py-1 text-center">
                  <span className="block text-[11px] font-semibold tracking-widest text-on-primary-container">私のサブスク</span>
                  <p className="num font-price-xl text-[30px] font-extrabold tracking-tight drop-shadow-sm">月額 ¥{yen(total)}</p>
                </div>
                <div className="relative z-10 -mx-4 -mb-4 flex items-center justify-between bg-inverse-surface/15 px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    {d.items.slice(0, 6).map((i) => (
                      <ServiceLogo key={i.serviceId} service={serviceById.get(i.serviceId)!} size="sm" />
                    ))}
                    {d.items.length > 6 && <span className="text-[11px] font-bold">+{d.items.length - 6}</span>}
                  </div>
                  <span className="text-[11px] text-on-primary-container">{d.items.length} サービス</span>
                </div>
              </div>
              <p className="mt-2 text-center font-label-sm text-label-sm text-outline">※ 公開後、この内容で X・LINE 用の共有画像ができます</p>
            </section>

            <fieldset className={`${card} p-space-md`}>
              <legend className="sr-only">公開範囲の設定</legend>
              <p className="mb-2 font-headline-sm text-headline-sm text-on-surface" aria-hidden>
                公開範囲の設定
              </p>
              <div className="flex flex-col gap-2">
                {VISIBILITY_OPTIONS.map((v) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all ${d.visibility === v.id ? "bg-primary-fixed/30 ring-1 ring-primary/30" : "bg-surface-container-low hover:bg-surface-container"}`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      checked={d.visibility === v.id}
                      onChange={() => set({ visibility: v.id })}
                      className="mt-1 accent-primary-container"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-2">
                        <span className="font-headline-sm text-headline-sm text-on-surface">{v.label}</span>
                        {v.id === "public" && <span className={`rounded px-1.5 font-label-sm text-[10px] ${onPrimaryContainer}`}>おすすめ</span>}
                      </span>
                      <span className="block font-body-sm text-body-sm text-on-surface-variant">{v.help}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <FormMessage state={result.ok ? undefined : result.error ? result : Object.keys(fields).length ? { error: Object.values(fields)[0] } : undefined} />
            <div className="flex flex-col gap-space-sm pt-2">
              <button
                type="button"
                className={`${primaryBtn} h-14 w-full font-headline-md text-headline-md`}
                disabled={pending || d.items.length === 0 || d.items.some((i) => i.monthlyPrice === "")}
                onClick={publish}
              >
                <span className={`${icon} text-[22px]`} aria-hidden>
                  celebration
                </span>
                {pending ? "公開しています…" : "構成を公開して完了する"}
                <span className={`${icon} text-[20px]`} aria-hidden>
                  arrow_forward
                </span>
              </button>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-1 px-1 font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary"
                  onClick={() => go(2)}
                >
                  <span className={`${icon} text-[18px]`} aria-hidden>
                    arrow_back
                  </span>
                  ステップ2に戻る
                </button>
                <Link
                  href="/"
                  className="inline-flex min-h-10 items-center gap-1 px-1 font-body-sm text-body-sm text-outline transition-colors hover:text-on-surface"
                >
                  <span className={`${icon} text-[18px]`} aria-hidden>
                    save
                  </span>
                  下書きを残してあとで入力
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function PlanSelect({
  id,
  plans,
  value,
  onChange,
}: {
  id: string;
  plans: Catalog["plans"];
  value: string | null;
  onChange: (planId: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-label-md text-label-md font-bold text-on-surface">
        契約プラン
      </label>
      <div className="relative">
        <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${inputCls} appearance-none pr-10`}>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（¥{yen(p.price)}/{p.billingCycle === "yearly" ? "年" : "月"}）
            </option>
          ))}
          <option value="">その他・プラン不明</option>
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[20px] text-outline" aria-hidden>
          expand_more
        </span>
      </div>
    </div>
  );
}

function PriceInput({ id, value, onChange, hint }: { id: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-label-md text-label-md font-bold text-on-surface">
        月額支払い額（税込）
        <span className="text-error" aria-hidden>
          {" "}*
        </span>
        <span className="sr-only">（必須）</span>
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 font-headline-sm text-headline-sm text-on-surface-variant">¥</span>
        <input
          id={id}
          inputMode="numeric"
          value={value ? yen(Number(value)) : ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
          aria-invalid={value === ""}
          className={`${inputCls} num pr-12 pl-8 font-price-md md:text-price-md`}
        />
        <span className="pointer-events-none absolute right-3 font-label-md text-label-md text-outline">/月</span>
      </div>
      <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
    </div>
  );
}

function ChoiceChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-space-xs font-label-md text-label-md font-bold text-on-surface">
        {label}
        <span className="font-label-sm text-label-sm font-normal text-outline">任意</span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(value === o ? null : o)}
            className={`min-h-9 rounded-full px-3 font-label-md text-label-md transition-colors ${value === o ? `${onPrimaryContainer} font-bold shadow-sm` : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Done({ handle, total, visibility }: { handle: string; total: number; visibility: Visibility }) {
  const url = `${SITE_URL}/@${handle}`;
  return (
    <div className="mx-auto w-full max-w-2xl px-margin-mobile pt-4 pb-24 md:px-margin">
      <section className={`${card} flex flex-col items-center gap-space-md p-space-lg text-center md:p-space-xl`}>
        <span className="flex size-16 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed-variant">
          <span className="material-symbols-outlined fill text-[36px]" aria-hidden>
            celebration
          </span>
        </span>
        <div>
          <p className="font-label-sm text-label-sm tracking-wider text-primary uppercase">Setup complete</p>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:text-headline-lg">構成ページができました！</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {visibility === "private" ? "非公開で保存しました。公開範囲はマイ構成からいつでも変えられます。" : "共有して、みんなの構成とくらべてみましょう。"}
          </p>
        </div>
        {visibility !== "private" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/u/${handle}/opengraph-image`} alt={`@${handle} の共有画像`} className="w-full rounded-xl shadow-md" />
            <ShareButtons url={url} text={`私のサブスクは月¥${yen(total)}！ #さぶすくなにつかってる`} />
          </>
        )}
        <div className="flex w-full flex-col justify-center gap-space-sm sm:w-auto sm:flex-row">
          {visibility !== "private" && (
            <Link href={`/@${handle}`} className={primaryBtn}>
              公開ページを見る
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                open_in_new
              </span>
            </Link>
          )}
          <Link href="/me" className={`${secondaryBtn} min-h-12`}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              edit
            </span>
            マイ構成を編集する
          </Link>
        </div>
      </section>
    </div>
  );
}
