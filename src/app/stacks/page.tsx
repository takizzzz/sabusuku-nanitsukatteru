import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CirclePlus, Search, SlidersHorizontal, X } from "lucide-react";
import { StackCard } from "@/components/stack-card";
import { getIndex } from "@/lib/data";
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
      label: `${serviceName.get(s) ?? s} を含む`,
      href: hrefWith(sp, { services: f.services!.filter((x) => x !== s) }),
    })),
    ...f.tags!.map((t) => ({ label: `#${t}`, href: hrefWith(sp, { tags: f.tags!.filter((x) => x !== t) }) })),
  ];

  const filters = (
    <form action="/stacks" className="space-y-6">
      <input type="hidden" name="sort" value={f.sort} />
      <Field title="フリーワード">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3">
          <Search className="size-4 text-subtle" aria-hidden />
          <input
            name="q"
            defaultValue={f.q}
            placeholder="サービス名・職種など"
            className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-subtle"
          />
        </label>
      </Field>
      <Field title="職種">
        {occupations.map((o) => (
          <Check key={o.occupation} name="occupation" value={o.occupation} checked={f.occupation!.includes(o.occupation)}>
            <span className="flex-1">{o.occupation}</span>
            <span className="num text-xs text-subtle">{o.count}</span>
          </Check>
        ))}
      </Field>
      <Field title="年代">
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((a) => (
            <Pill key={a} name="age" value={a} checked={f.age!.includes(a)}>
              {a}
            </Pill>
          ))}
        </div>
      </Field>
      <Field title="月額合計">
        <Radio name="budget" value="" checked={!f.budget}>
          すべて
        </Radio>
        {BUDGET_BANDS.map((b) => (
          <Radio key={b.id} name="budget" value={b.id} checked={f.budget === b.id}>
            {b.label}
          </Radio>
        ))}
      </Field>
      <Field title="含むサービス（すべて含む）">
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <Pill key={s.service.id} name="services" value={s.service.slug} checked={f.services!.includes(s.service.slug)}>
              {s.service.name}
            </Pill>
          ))}
        </div>
      </Field>
      <Field title="用途タグ">
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Pill key={t} name="tags" value={t} checked={f.tags!.includes(t)}>
              #{t}
            </Pill>
          ))}
        </div>
      </Field>
      <div className="flex gap-2">
        <button type="submit" className="min-h-11 flex-1 rounded-lg bg-accent font-bold text-on-accent hover:bg-accent-strong">
          この条件で探す
        </button>
        <Link href="/stacks" className="flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-bold">
          リセット
        </Link>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">みんなのサブスク構成を探す</h1>
          <p className="mt-1 text-sm text-muted">職種・年代・月額や、気になるサービスから絞り込めます。</p>
        </div>
        <p className="text-sm font-bold">
          該当 <span className="num text-2xl text-accent-strong">{results.length}</span> 件
        </p>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
        {/* PC：サイドバー */}
        <aside className="hidden md:block">
          <div className="sticky top-20 rounded-2xl border border-line bg-card p-5">{filters}</div>
        </aside>

        <div className="min-w-0">
          {/* SP：折りたたみ */}
          <details className="mb-4 rounded-2xl border border-line bg-card md:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold">
              <SlidersHorizontal className="size-4" aria-hidden />
              絞り込み
              {chips.length > 0 && (
                <span className="rounded-full bg-accent px-2 text-xs text-on-accent">{chips.length}</span>
              )}
            </summary>
            <div className="border-t border-line p-4">{filters}</div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-2" aria-label="適用中の条件">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    className="flex min-h-8 items-center gap-1 rounded-full bg-accent-soft px-3 text-xs font-bold text-accent-strong"
                  >
                    {c.label}
                    <X className="size-3" aria-label="条件を外す" />
                  </Link>
                </li>
              ))}
            </ul>
            <nav aria-label="並び替え" className="no-scrollbar flex overflow-x-auto rounded-lg bg-surface-2 p-1">
              {SORTS.map((s) => (
                <Link
                  key={s.id}
                  href={hrefWith(sp, { sort: s.id })}
                  aria-current={f.sort === s.id ? "true" : undefined}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap ${f.sort === s.id ? "bg-card shadow-sm" : "text-subtle"}`}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>

          {shown.length > 0 ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {shown.map((s) => (
                <StackCard key={s.profile.id} stack={s} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-card p-8 text-center">
              <p className="font-bold">条件に合う構成が見つかりませんでした</p>
              <p className="mt-2 text-sm text-muted">条件を減らすと見つかるかもしれません。上の条件の × から外せます。</p>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="ページ" className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={hrefWith(sp, { page: String(page - 1) })} className="flex size-11 items-center justify-center rounded-lg border border-line" aria-label="前のページ">
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              <span className="num px-3 text-sm font-bold">
                {page} / {pages}
              </span>
              {page < pages && (
                <Link href={hrefWith(sp, { page: String(page + 1) })} className="flex size-11 items-center justify-center rounded-lg border border-line" aria-label="次のページ">
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </nav>
          )}

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-surface-3 p-6 md:flex-row md:items-center">
            <div className="flex-1">
              <p className="text-lg font-extrabold">探している構成が見つからないときは？</p>
              <p className="mt-1 text-sm text-muted">あなたの構成と使い分けを登録して、同じ悩みを持つ人にシェアしてみませんか。</p>
            </div>
            <Link href="/welcome" className="flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-on-accent">
              <CirclePlus className="size-5" aria-hidden />
              自分の構成を登録する
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold text-subtle">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ name, value, checked, children }: { name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-surface-2 has-checked:bg-accent-soft has-checked:font-bold">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="size-4 accent-accent" />
      {children}
    </label>
  );
}

function Radio({ name, value, checked, children }: { name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-2 px-2 text-sm">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="size-4 accent-accent" />
      {children}
    </label>
  );
}

function Pill({ name, value, checked, children }: { name: string; value: string; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="inline-flex min-h-9 items-center rounded-full border border-line px-3 text-xs font-semibold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
        {children}
      </span>
    </label>
  );
}
