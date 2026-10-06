"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, PartyPopper, Trash2 } from "lucide-react";
import { VISIBILITY_OPTIONS } from "@/components/visibility";
import { CATEGORY_COLORS } from "@/components/category-bar";
import { DemoNotice } from "@/components/demo-notice";
import { Field, FormMessage, inputCls, primaryBtn, secondaryBtn } from "@/components/forms/field";
import { ServicePicker } from "@/components/forms/service-picker";
import { StarInput } from "@/components/forms/star-input";
import { TagInput } from "@/components/forms/tag-input";
import { Price } from "@/components/price";
import { ServiceLogo } from "@/components/service-logo";
import { ShareButtons } from "@/components/share-buttons";
import { completeOnboarding, type OnboardingResult } from "@/lib/actions/subscriptions";
import { monthlyOfPlan, type Catalog } from "@/lib/catalog";
import { SITE_URL, yen } from "@/lib/format";
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
      .map((c) => ({ c, amount: m.get(c.id)!, ratio: total ? m.get(c.id)! / total : 0 }));
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
      <header className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <div>
          <p className="text-xs font-bold text-accent-strong">あと少しで、あなたのサブスク構成ページができます</p>
          <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">構成のセットアップ</h1>
        </div>
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Draft["step"];
            const state = d.step > n ? "done" : d.step === n ? "now" : "todo";
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={n > d.step}
                  onClick={() => set({ step: n })}
                  aria-current={state === "now" ? "step" : undefined}
                  className={`flex w-full items-center gap-2 rounded-xl p-2 text-left md:p-3 ${state === "now" ? "bg-accent-soft" : "bg-surface-2"}`}
                >
                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${state === "todo" ? "bg-surface-3 text-subtle" : "bg-accent text-on-accent"}`}>
                    {state === "done" ? <Check className="size-4" aria-hidden /> : n}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold text-subtle">STEP {n}</span>
                    <span className="block truncate text-xs font-bold md:text-sm">{label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {demo && <DemoNotice>デモ表示中です。入力の流れは試せますが、最後の公開は保存されません。</DemoNotice>}
      </header>

      {d.step === 1 && (
        <section className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-line bg-surface p-5" aria-labelledby="s1">
          <h2 id="s1" className="text-lg font-extrabold">あなたについて</h2>
          <Field label="表示名" htmlFor="displayName" required error={fields.displayName} counter={{ value: d.displayName.length, max: DISPLAY_NAME_MAX }}>
            <input id="displayName" value={d.displayName} onChange={(e) => set({ displayName: e.target.value })} className={inputCls} placeholder="例：けんじ" />
          </Field>
          <Field label="ユーザーID（公開URL）" htmlFor="handle" required error={fields.handle} hint={`公開ページは ${SITE_URL.replace(/^https?:\/\//, "")}/@${d.handle || "your_id"} になります。半角英小文字・数字・_ の3〜20文字。`}>
            <div className="flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent">
              <span className="pl-3 text-subtle">@</span>
              <input
                id="handle"
                value={d.handle}
                onChange={(e) => set({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) })}
                className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base outline-none md:text-sm"
                placeholder="kenji_dev"
                autoCapitalize="off"
              />
            </div>
          </Field>
          <ChoiceChips label="職種" options={OCCUPATIONS} value={d.occupation} onChange={(v) => set({ occupation: v })} />
          <ChoiceChips label="年代" options={AGE_RANGES} value={d.ageRange} onChange={(v) => set({ ageRange: v })} />
          <p className="text-xs text-subtle">職種と年代は任意です。入れておくと、似た人の構成を探すときに見つけてもらいやすくなります。</p>
          {step1Error && (d.displayName || d.handle) && <p className="text-xs font-bold text-danger">{step1Error}</p>}
          <div className="flex justify-end">
            <button type="button" className={primaryBtn} disabled={!!step1Error} onClick={() => set({ step: 2 })}>
              次へ：サブスクを選ぶ
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </section>
      )}

      {d.step === 2 && (
        <section className="space-y-5 rounded-2xl border border-line bg-surface p-5" aria-labelledby="s2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="s2" className="text-lg font-extrabold">使っているサブスクをタップ</h2>
            <p className="text-sm font-bold text-accent-strong">
              <span className="num">{d.items.length}</span>件選択中
            </p>
          </div>
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
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={secondaryBtn} onClick={() => set({ step: 1 })}>
              <ArrowLeft className="size-4" aria-hidden />
              戻る
            </button>
            <button type="button" className={primaryBtn} disabled={d.items.length === 0} onClick={() => set({ step: 3 })}>
              次へ：プランを入力
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </section>
      )}

      {d.step === 3 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="min-w-0 space-y-4" aria-labelledby="s3">
            <div className="flex items-center justify-between">
              <h2 id="s3" className="text-lg font-extrabold">
                選んだサブスク <span className="num text-sm text-subtle">{d.items.length}件</span>
              </h2>
              <button type="button" className="text-sm font-bold text-accent-strong hover:underline" onClick={() => set({ step: 2 })}>
                ＋ サービスを追加
              </button>
            </div>
            {d.items.map((item) => {
              const s = serviceById.get(item.serviceId)!;
              const plans = plansOf(s.id);
              return (
                <article key={s.id} className="space-y-4 rounded-2xl border border-line bg-surface p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <ServiceLogo service={s} size="lg" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold">{s.name}</h3>
                      {s.company && <p className="text-xs text-subtle">{s.company}</p>}
                    </div>
                    <button
                      type="button"
                      aria-label={`${s.name} を外す`}
                      onClick={() => setD((x) => ({ ...x, items: x.items.filter((i) => i.serviceId !== s.id) }))}
                      className="flex size-10 items-center justify-center rounded-lg text-subtle hover:bg-surface-2 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="プラン" htmlFor={`plan-${s.id}`}>
                      <select
                        id={`plan-${s.id}`}
                        value={item.planId ?? ""}
                        onChange={(e) => {
                          const plan = plans.find((p) => p.id === e.target.value);
                          setItem(s.id, { planId: plan?.id ?? null, monthlyPrice: plan ? String(monthlyOfPlan(plan)) : item.monthlyPrice });
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
                    <Field label="月額（円）" htmlFor={`price-${s.id}`} required hint={plans.find((p) => p.id === item.planId)?.billingCycle === "yearly" ? "年額プランを12で割った額です" : "プランから自動入力。実際の金額に直せます"}>
                      <div className="flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent">
                        <span className="pl-3 text-subtle">¥</span>
                        <input
                          id={`price-${s.id}`}
                          inputMode="numeric"
                          value={item.monthlyPrice}
                          onChange={(e) => setItem(s.id, { monthlyPrice: e.target.value.replace(/\D/g, "").slice(0, 7) })}
                          className="num min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base outline-none md:text-sm"
                        />
                        <span className="pr-3 text-xs text-subtle">/月</span>
                      </div>
                    </Field>
                  </div>
                  <Field label="何に使ってる？（用途タグ）" optional>
                    <TagInput value={item.tags} onChange={(tags) => setItem(s.id, { tags })} suggestions={[...s.tags, ...catalog.popularTags]} />
                  </Field>
                  <div className="space-y-3 rounded-xl bg-surface-2 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold">満足度</span>
                      <StarInput value={item.satisfaction} onChange={(v) => setItem(s.id, { satisfaction: v })} label={`${s.name} の満足度`} />
                    </div>
                    <Field label="使い方コメント" optional htmlFor={`c-${s.id}`} counter={{ value: item.comment.length, max: COMMENT_MAX }}>
                      <textarea
                        id={`c-${s.id}`}
                        rows={3}
                        value={item.comment}
                        onChange={(e) => setItem(s.id, { comment: e.target.value })}
                        placeholder="どんな場面で使っているか、ほかのサービスとの使い分けなど"
                        className={`${inputCls} py-2`}
                      />
                    </Field>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <section className="rounded-2xl border border-line bg-surface p-5" aria-label="構成サマリー">
              <p className="text-xs font-bold text-subtle">月額合計</p>
              <Price value={total} size="lg" />
              <p className="mt-2 flex justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-subtle">年間換算</span>
                <span className="num font-bold">¥{yen(total * 12)}/年</span>
              </p>
              {shares.length > 0 && (
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-surface-3" role="img" aria-label="カテゴリ別の内訳">
                  {shares.map((x) => (
                    <span key={x.c.id} style={{ width: `${x.ratio * 100}%`, background: CATEGORY_COLORS[x.c.slug] ?? "#888" }} />
                  ))}
                </div>
              )}
              <div className="mt-4 rounded-xl bg-gradient-to-br from-accent to-accent-strong p-4 text-white">
                <p className="text-xs font-bold opacity-90">@{d.handle || "your_id"}</p>
                <p className="mt-2 text-xs opacity-80">私のサブスク</p>
                <p className="num text-3xl font-extrabold">月¥{yen(total)}</p>
                <p className="mt-3 flex flex-wrap gap-1">
                  {d.items.slice(0, 6).map((i) => (
                    <ServiceLogo key={i.serviceId} service={serviceById.get(i.serviceId)!} size="sm" />
                  ))}
                  {d.items.length > 6 && <span className="text-xs font-bold">+{d.items.length - 6}</span>}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-subtle">公開後、この内容でX・LINE用の共有画像ができます。</p>
            </section>

            <fieldset className="space-y-2 rounded-2xl border border-line bg-surface p-5">
              <legend className="px-1 text-sm font-extrabold">公開範囲</legend>
              {VISIBILITY_OPTIONS.map((v) => (
                <label key={v.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${d.visibility === v.id ? "border-accent bg-accent-soft/50" : "border-line"}`}>
                  <input type="radio" name="visibility" checked={d.visibility === v.id} onChange={() => set({ visibility: v.id })} className="mt-1 accent-[var(--accent)]" />
                  <span>
                    <span className="block text-sm font-bold">{v.label}</span>
                    <span className="block text-xs text-muted">{v.help}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <FormMessage state={result.ok ? undefined : result.error ? result : Object.keys(fields).length ? { error: Object.values(fields)[0] } : undefined} />
            <button
              type="button"
              className={`${primaryBtn} w-full`}
              disabled={pending || d.items.length === 0 || d.items.some((i) => i.monthlyPrice === "")}
              onClick={publish}
            >
              <PartyPopper className="size-4" aria-hidden />
              {pending ? "公開しています…" : "構成を公開して完了する"}
            </button>
            <button type="button" className="flex items-center gap-1 text-sm text-subtle hover:underline" onClick={() => set({ step: 2 })}>
              <ArrowLeft className="size-4" aria-hidden />
              ステップ2に戻る
            </button>
          </aside>
        </div>
      )}
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
      <legend className="mb-2 text-sm font-bold">
        {label}
        <span className="ml-2 rounded bg-surface-3 px-1.5 py-px text-[10px] font-bold text-subtle">任意</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={value === o}
            onClick={() => onChange(value === o ? null : o)}
            className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${value === o ? "border-accent bg-accent text-on-accent" : "border-line bg-surface hover:border-accent"}`}
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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-center">
      <PartyPopper className="mx-auto size-10 text-accent" aria-hidden />
      <h1 className="text-2xl font-extrabold md:text-3xl">構成ページができました！</h1>
      <p className="text-muted">
        {visibility === "private" ? "非公開で保存しました。公開範囲はマイ構成からいつでも変えられます。" : "共有して、みんなの構成とくらべてみましょう。"}
      </p>
      {visibility !== "private" && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/u/${handle}/opengraph-image`} alt={`@${handle} の共有画像`} className="mx-auto w-full rounded-2xl border border-line" />
          <div className="flex justify-center">
            <ShareButtons url={url} text={`私のサブスクは月¥${yen(total)}！ #さぶすくなにつかってる`} />
          </div>
        </>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {visibility !== "private" && (
          <Link href={`/@${handle}`} className={primaryBtn}>
            公開ページを見る
          </Link>
        )}
        <Link href="/me" className={secondaryBtn}>
          マイ構成を編集する
        </Link>
      </div>
    </div>
  );
}
