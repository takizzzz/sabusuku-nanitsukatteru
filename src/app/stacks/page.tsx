import type { Metadata } from "next";
import Link from "next/link";
import { SortSelect } from "@/components/sort-select";
import { StackCard } from "@/components/stack-card";
import { getIndex } from "@/lib/data";
import { yen } from "@/lib/format";
import {
  AGE_GROUPS,
  BUDGET_BANDS,
  SORTS,
  type SortId,
  type StackFilter,
  occupationCounts,
  popularTags,
  searchStacks,
  serviceStats,
} from "@/lib/stacks";

export const metadata: Metadata = {
  title: "みんなのサブスク構成を探す",
  description: "職種・年代・月額や、気になるサービスから、みんなのサブスク構成と使い分けを探せます。",
};

const PER_PAGE = 12;

type Params = Record<string, string | string[] | undefined>;

function list(v: string | string[] | undefined): string[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function parse(sp: Params): StackFilter & { page: number } {
  const sort = (list(sp.sort)[0] ?? "popular") as SortId;
  return {
    q: list(sp.q)[0],
    occupation: list(sp.occupation),
    age: list(sp.age),
    budget: list(sp.budget)[0],
    services: list(sp.services),
    tags: list(sp.tags),
    sort: SORTS.some((s) => s.id === sort) ? sort : "popular",
    page: Math.max(1, Number(list(sp.page)[0]) || 1),
  };
}

/** 現在の条件から1つ値を足し引きした URL を作る */
function hrefWith(sp: Params, changes: Record<string, string | string[] | null>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page" || k in changes) continue;
    for (const x of list(v)) qs.append(k, x);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === null) continue;
    for (const x of Array.isArray(v) ? v : [v]) qs.append(k, x);
  }
  const s = qs.toString();
  return s ? `/stacks?${s}` : "/stacks";
}

/** 1 2 3 … 28 のようなページ番号の並び */
function pageItems(page: number, pages: number): (number | "gap")[] {
  const want = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  if (page <= 2) [2, 3].forEach((n) => n <= pages && want.add(n));
  if (page >= pages - 1) [pages - 1, pages - 2].forEach((n) => n >= 1 && want.add(n));
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

const icon = (name: string, cls = "text-[16px]") => (
  <span className={`material-symbols-outlined ${cls}`} aria-hidden>
    {name}
  </span>
);

export default async function StacksPage({ searchParams }: PageProps<"/stacks">) {
  const sp = await searchParams;
  const f = parse(sp);
  const idx = await getIndex();

  const results = searchStacks(idx, f);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(f.page, pages);
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const occupations = occupationCounts(idx);
  const services = serviceStats(idx)
    .filter((s) => s.activeUsers > 0)
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, 12);
  const tags = popularTags(idx, 10);
  const serviceName = new Map(idx.ds.services.map((s) => [s.slug, s.name]));

  const chips = [
    ...(f.q ? [{ label: `「${f.q}」`, href: hrefWith(sp, { q: null }) }] : []),
    ...f.occupation!.map((o) => ({
      label: o,
      href: hrefWith(sp, { occupation: f.occupation!.filter((x) => x !== o) }),
    })),
    ...f.age!.map((a) => ({ label: a, href: hrefWith(sp, { age: f.age!.filter((x) => x !== a) }) })),
    ...(f.budget
      ? [{ label: BUDGET_BANDS.find((b) => b.id === f.budget)?.label ?? f.budget, href: hrefWith(sp, { budget: null }) }]
      : []),
    ...f.services!.map((s) => ({
      label: `${serviceName.get(s) ?? s} 含む`,
      href: hrefWith(sp, { services: f.services!.filter((x) => x !== s) }),
    })),
    ...f.tags!.map((t) => ({ label: `#${t}`, href: hrefWith(sp, { tags: f.tags!.filter((x) => x !== t) }) })),
  ];
  const clearHref = f.sort === "popular" ? "/stacks" : `/stacks?sort=${f.sort}`;

  const filters = (
    <form action="/stacks" className="space-y-space-md">
      <input type="hidden" name="sort" value={f.sort} />
      <Field title="フリーワード">
        <label className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline" aria-hidden>
            search
          </span>
          <span className="sr-only">フリーワード</span>
          <input
            name="q"
            defaultValue={f.q}
            placeholder="サービス名・職種など"
            className="h-10 w-full rounded-lg bg-surface-container-low pr-3 pl-9 font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-outline focus:bg-surface-container-high focus:outline-none"
          />
        </label>
      </Field>
      <Field title="職種">
        <div className="space-y-1.5">
          {occupations.map((o) => (
            <label
              key={o.occupation}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-surface-container-low has-checked:bg-surface-container-high has-checked:[&_.name]:font-semibold"
            >
              <span className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  name="occupation"
                  value={o.occupation}
                  defaultChecked={f.occupation!.includes(o.occupation)}
                  className="size-4 shrink-0 rounded accent-primary-container"
                />
                <span className="name truncate font-body-sm text-body-sm text-on-surface">{o.occupation}</span>
              </span>
              <span className="num font-label-sm text-label-sm font-normal text-on-surface-variant">{o.count}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field title="年代">
        <div className="flex flex-wrap gap-1.5">
          {AGE_GROUPS.map((a) => (
            <Pill key={a} name="age" value={a} checked={f.age!.includes(a)}>
              {a}
            </Pill>
          ))}
        </div>
      </Field>
      <Field title="月額合計予算">
        <div className="space-y-1.5">
          <Radio name="budget" value="" checked={!f.budget}>
            すべて
          </Radio>
          {BUDGET_BANDS.map((b) => (
            <Radio key={b.id} name="budget" value={b.id} checked={f.budget === b.id}>
              {b.label}
            </Radio>
          ))}
        </div>
      </Field>
      <Field title="含むサービス（すべて含む）">
        <div className="flex flex-wrap gap-1.5">
          {services.map((s) => (
            <label key={s.service.id} className="cursor-pointer">
              <input
                type="checkbox"
                name="services"
                value={s.service.slug}
                defaultChecked={f.services!.includes(s.service.slug)}
                className="peer sr-only"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container peer-checked:bg-primary-container peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-checked:[&>.check]:inline-block">
                {s.service.name}
                <span className="check hidden" aria-hidden>
                  <span className="material-symbols-outlined align-middle text-[13px]">check</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </Field>
      <Field title="用途タグ">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <label key={t} className="cursor-pointer">
              <input type="checkbox" name="tags" value={t} defaultChecked={f.tags!.includes(t)} className="peer sr-only" />
              <span className="inline-flex rounded bg-surface-container px-2 py-1 font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high peer-checked:bg-primary-container peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                #{t}
              </span>
            </label>
          ))}
        </div>
      </Field>
      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-primary-container font-headline-sm text-headline-sm text-white shadow-sm transition-colors hover:bg-primary hover:text-on-primary"
      >
        この条件で探す
      </button>
    </form>
  );

  const count = (
    <>
      該当 <span className="num">{yen(results.length)}</span>件
    </>
  );

  return (
    <div className="flex w-full flex-col">
      {/* 見出し */}
      <section className="w-full lg:bg-surface-container-low lg:py-space-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-margin-mobile pt-3 pb-4 lg:flex-row lg:items-end lg:justify-between lg:gap-space-md lg:px-margin lg:py-0">
          <div className="flex items-center justify-between lg:max-w-2xl lg:flex-col lg:items-start lg:gap-space-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed">
              {icon("stacks", "text-[14px] lg:text-[15px]")}
              <span>Real Stacks Directory</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant lg:hidden">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
              <span className="font-bold text-on-surface">{count}</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">みんなのサブスク構成を探す</h1>
              <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
                職種・年代・月額予算や気になるツールから、実際のリアルな使い分け構成を絞り込み検索できます
              </p>
            </div>
          </div>
          <div className="lg:hidden">
            <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface">みんなのサブスク構成を探す</h1>
            <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
              職種・年代・月額予算や気になるツールから、実際のリアルな使い分け構成を絞り込み検索できます
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-surface-container-lowest px-space-md py-2 shadow-sm lg:flex">
            <span className="size-2.5 animate-pulse rounded-full bg-primary" aria-hidden />
            <span className="font-headline-sm text-headline-sm text-on-surface">
              該当 <span className="num font-price-lg text-price-lg text-primary">{yen(results.length)}</span> 件
            </span>
          </div>
        </div>
      </section>

      {/* SP：検索と絞り込み */}
      <section className="mb-3 flex flex-col gap-2.5 px-margin-mobile lg:hidden">
        <form action="/stacks" role="search" className="relative flex w-full items-center rounded-xl bg-surface-container-lowest shadow-sm">
          {Object.entries(sp).flatMap(([k, v]) =>
            k === "q" || k === "page" ? [] : list(v).map((x, i) => <input key={`${k}-${i}`} type="hidden" name={k} value={x} />),
          )}
          <span className="material-symbols-outlined pointer-events-none absolute left-3.5 text-[20px] text-on-surface-variant" aria-hidden>
            search
          </span>
          <label className="sr-only" htmlFor="stacks-q">
            職種、ツール名、キーワードで検索
          </label>
          <input
            id="stacks-q"
            name="q"
            defaultValue={f.q}
            placeholder="職種、ツール名、キーワードで検索..."
            className="h-11 w-full rounded-xl bg-transparent pr-24 pl-10 font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-outline focus:bg-surface-container-low focus:outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {f.q && (
              <Link
                href={hrefWith(sp, { q: null })}
                aria-label="キーワードを消す"
                className="flex size-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                {icon("close")}
              </Link>
            )}
            <button
              type="submit"
              className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 font-label-sm text-label-sm text-on-primary shadow-sm transition-transform active:scale-95"
            >
              検索
            </button>
          </div>
        </form>

        {/* 絞り込みパネルの開閉（CSS のみ） */}
        <input type="checkbox" id="stacks-filter-toggle" className="peer sr-only" aria-controls="stacks-filter-panel" />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <label
              htmlFor="stacks-filter-toggle"
              className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container-high px-3 font-label-sm text-label-sm text-on-surface shadow-sm transition-colors active:bg-surface-container-highest"
            >
              {icon("tune", "text-[16px] text-primary")}
              <span className="font-semibold">絞り込み</span>
              {chips.length > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary font-label-sm text-[10px] font-bold text-on-primary">
                  {chips.length}
                </span>
              )}
            </label>
            <SortSelect options={SORTS.map((s) => ({ id: s.id, label: s.label, href: hrefWith(sp, { sort: s.id }), current: f.sort === s.id }))} />
          </div>
          <Link
            href="/stacks"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            {icon("restart_alt", "text-[14px]")}
            <span>リセット</span>
          </Link>
        </div>
        <div id="stacks-filter-panel" className="hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm peer-checked:block">
          {filters}
        </div>

        {chips.length > 0 && (
          <ul className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1" aria-label="適用中の条件">
            {chips.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm whitespace-nowrap text-on-surface shadow-sm"
                >
                  <span>{c.label}</span>
                  <span className="material-symbols-outlined text-[14px] hover:text-error" aria-label="条件を外す">
                    close
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={clearHref} className="px-1 font-label-sm text-label-sm whitespace-nowrap text-primary hover:underline">
                クリア
              </Link>
            </li>
          </ul>
        )}
      </section>

      {/* SP：職種・予算のプリセット */}
      <section className="mb-4 flex flex-col gap-2 lg:hidden">
        <ul className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-margin-mobile py-0.5" aria-label="職種で絞り込む">
          <li>
            <Link
              href={hrefWith(sp, { occupation: null })}
              className={presetCls(f.occupation!.length === 0)}
              aria-current={f.occupation!.length === 0 ? "true" : undefined}
            >
              すべて
            </Link>
          </li>
          {occupations.slice(0, 8).map((o) => {
            const on = f.occupation!.length === 1 && f.occupation![0] === o.occupation;
            return (
              <li key={o.occupation}>
                <Link href={hrefWith(sp, { occupation: o.occupation })} className={presetCls(on)} aria-current={on ? "true" : undefined}>
                  <span>{o.occupation}</span>
                  <span className={`num text-[10px] ${on ? "text-on-primary/80" : "text-outline"}`}>{o.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-margin-mobile py-0.5" aria-label="月額合計で絞り込む">
          <li className="px-1 text-[11px] font-semibold whitespace-nowrap text-outline">予算目安:</li>
          {[{ id: null, label: "すべて" }, ...BUDGET_BANDS].map((b) => {
            const on = (f.budget ?? null) === b.id;
            return (
              <li key={b.id ?? "all"}>
                <Link
                  href={hrefWith(sp, { budget: b.id })}
                  aria-current={on ? "true" : undefined}
                  className={`flex h-7 items-center rounded-md px-2.5 font-label-sm text-[11px] whitespace-nowrap shadow-sm ${
                    on ? "bg-primary-fixed font-bold text-on-primary-fixed" : "bg-surface-container-lowest font-normal text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {b.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 本体 */}
      <section className="mx-auto w-full max-w-7xl px-margin-mobile lg:px-margin lg:py-space-xl">
        <div className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
          {/* PC：サイドバー */}
          <aside className="hidden space-y-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm lg:sticky lg:top-20 lg:col-span-4 lg:block xl:col-span-3">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs text-on-surface">
                {icon("tune", "text-[20px] text-primary")}
                <h2 className="font-headline-sm text-headline-sm">絞り込み条件</h2>
              </div>
              <Link href="/stacks" className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary">
                {icon("restart_alt")}
                リセット
              </Link>
            </div>
            {filters}
          </aside>

          <div className="min-w-0 space-y-space-lg lg:col-span-8 xl:col-span-9">
            {/* PC：適用中の条件と並び替え */}
            <div className="hidden items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm lg:flex">
              <ul className="flex flex-wrap items-center gap-space-xs" aria-label="適用中の条件">
                <li className="mr-1 font-label-sm text-label-sm text-on-surface-variant">適用中:</li>
                {chips.length === 0 && <li className="font-label-sm text-label-sm font-normal text-outline">なし</li>}
                {chips.map((c) => (
                  <li key={c.label}>
                    <Link
                      href={c.href}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed"
                    >
                      {c.label}
                      <span className="material-symbols-outlined text-[14px]" aria-label="条件を外す">
                        close
                      </span>
                    </Link>
                  </li>
                ))}
                {chips.length > 0 && (
                  <li>
                    <Link href={clearHref} className="ml-1 font-label-sm text-label-sm text-outline transition-colors hover:text-error">
                      条件をクリア
                    </Link>
                  </li>
                )}
              </ul>
              <nav aria-label="並び替え" className="flex shrink-0 items-center rounded-lg bg-surface-container-low p-1">
                {SORTS.map((s) => (
                  <Link
                    key={s.id}
                    href={hrefWith(sp, { sort: s.id })}
                    aria-current={f.sort === s.id ? "true" : undefined}
                    className={`rounded-md px-3 py-1.5 font-label-md text-label-md whitespace-nowrap transition-colors ${
                      f.sort === s.id ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>

            {shown.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-gutter">
                {shown.map((s) => (
                  <StackCard key={s.profile.id} stack={s} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm">
                <p className="font-headline-sm text-headline-sm text-on-surface">条件に合う構成が見つかりませんでした</p>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">条件を減らすと見つかるかもしれません。条件の × から外せます。</p>
              </div>
            )}

            {pages > 1 && <Pagination sp={sp} page={page} pages={pages} />}
          </div>
        </div>
      </section>

      {/* 見つからないときの CTA */}
      <section className="mt-6 mb-2 px-margin-mobile lg:mt-space-xl lg:mb-0 lg:w-full lg:bg-surface-container-high lg:py-space-xl">
        <div className="mx-auto max-w-7xl lg:px-margin">
          <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container via-primary to-primary p-5 text-white shadow-md lg:flex-row lg:items-center lg:justify-between lg:gap-space-lg lg:bg-none lg:bg-surface-container-lowest lg:p-space-xl lg:text-on-surface dark:via-primary-container dark:to-inverse-primary lg:dark:bg-none">
            <div aria-hidden className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/10 blur-xl lg:-top-16 lg:-right-16 lg:size-64 lg:bg-primary-fixed lg:opacity-50 lg:blur-3xl" />
            <div className="relative z-10 flex max-w-xl flex-col gap-3 lg:gap-space-xs">
              <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/20 px-2.5 py-1 font-label-sm text-[11px] text-white backdrop-blur-md lg:bg-secondary-container lg:px-3 lg:text-label-sm lg:font-bold lg:text-on-secondary-container">
                {icon("add_circle", "text-[14px] lg:text-[16px]")}
                <span>あなたの構成も共有しませんか？</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm leading-tight font-bold text-white lg:font-headline-lg lg:text-headline-lg lg:text-on-surface">
                  探している構成が見つからないときは？
                </h2>
                <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-white/80 lg:font-body-md lg:text-body-md lg:text-on-surface-variant">
                  あなたの愛用サブスクや使い分けの工夫を登録して、同じ職種や悩みを持つ人にシェアしてみませんか。
                </p>
              </div>
            </div>
            <Link
              href="/welcome"
              className="relative z-10 mt-1 flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-surface-container-lowest font-label-md text-label-md font-bold text-primary shadow-md transition-transform active:scale-[0.98] lg:mt-0 lg:h-auto lg:w-auto lg:gap-2 lg:bg-primary-container lg:px-space-xl lg:py-3.5 lg:font-headline-sm lg:text-headline-sm lg:text-white lg:hover:bg-primary"
            >
              {icon("post_add", "text-[18px] lg:text-[20px]")}
              <span>自分の構成を登録してシェアする</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function presetCls(on: boolean): string {
  return `flex h-8 items-center gap-1 rounded-full px-3 font-label-sm text-label-sm whitespace-nowrap shadow-sm ${
    on ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
  }`;
}

function Pagination({ sp, page, pages }: { sp: Params; page: number; pages: number }) {
  const base = "flex size-9 items-center justify-center rounded-lg shadow-sm lg:size-10 lg:shadow-none";
  const idle = "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface lg:text-on-surface lg:hover:bg-surface-container";
  return (
    <nav aria-label="ページ" className="flex items-center justify-center gap-1 pt-2 pb-2 lg:gap-space-xs lg:pt-space-lg">
      {page > 1 ? (
        <Link href={hrefWith(sp, { page: String(page - 1) })} aria-label="前のページ" className={`${base} ${idle}`}>
          {icon("chevron_left", "text-[18px] lg:text-[20px]")}
        </Link>
      ) : (
        <span aria-hidden className={`${base} bg-surface-container-lowest text-outline opacity-40 lg:bg-surface-container`}>
          {icon("chevron_left", "text-[18px] lg:text-[20px]")}
        </span>
      )}
      {pageItems(page, pages).map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="px-1 font-label-sm text-label-sm text-outline lg:flex lg:size-10 lg:items-center lg:justify-center">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefWith(sp, { page: String(n) })}
            aria-current={n === page ? "page" : undefined}
            className={`${base} num font-label-sm text-label-sm lg:font-headline-sm lg:text-headline-sm ${
              n === page ? "bg-primary font-bold text-white lg:bg-primary-container lg:text-white lg:shadow-sm" : `${idle} font-semibold`
            }`}
          >
            {n}
          </Link>
        ),
      )}
      {page < pages ? (
        <Link
          href={hrefWith(sp, { page: String(page + 1) })}
          aria-label="次のページ"
          className={`${base} ${idle} lg:w-auto lg:gap-1 lg:px-space-md lg:font-headline-sm lg:text-headline-sm`}
        >
          <span className="hidden lg:inline">次へ</span>
          {icon("chevron_right", "text-[18px] lg:text-[20px]")}
        </Link>
      ) : (
        <span aria-hidden className={`${base} bg-surface-container-lowest text-outline opacity-40 lg:bg-surface-container`}>
          {icon("chevron_right", "text-[18px] lg:text-[20px]")}
        </span>
      )}
    </nav>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-space-xs pt-space-xs">
      <legend className="mb-space-xs font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

function Radio({ name, value, checked, children }: { name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface has-checked:font-semibold has-checked:text-on-surface">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="size-3.5 accent-primary-container" />
      {children}
    </label>
  );
}

function Pill({ name, value, checked, children }: { name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="inline-flex rounded-full bg-surface-container-low px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface peer-checked:bg-primary-container peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
        {children}
      </span>
    </label>
  );
}
