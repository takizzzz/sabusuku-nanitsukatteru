import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PairChips } from "@/components/pair-chips";
import { getIndex } from "@/lib/data";
import { pairSlug, topPairs } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "サブスクの併用比較",
  description: "2つのサブスクを両方使っている人が、それぞれを何に使い分けているかを比べられます。",
};

const selectCls =
  "min-h-12 w-full rounded-lg border-0 bg-surface-container-low px-3 font-body-md text-body-md text-on-surface ring-1 ring-outline-variant/60 focus:ring-2 focus:ring-primary focus:outline-none";

/** 併用比較の入口。2つ選ぶと /compare/{a}-{b} へ */
export default async function CompareIndex({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const idx = await getIndex();
  const a = idx.ds.services.find((s) => s.slug === sp.a);
  const b = idx.ds.services.find((s) => s.slug === sp.b);
  if (a && b && a.id !== b.id) redirect(`/compare/${pairSlug(a, b)}`);

  const services = [...idx.ds.services].sort((x, y) => x.name.localeCompare(y.name));
  const pairs = topPairs(idx, 12);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-space-lg px-margin-mobile pt-3 pb-8 lg:max-w-3xl lg:px-margin lg:py-space-lg">
      <header className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-variant p-space-md shadow-sm lg:p-space-lg">
        <div className="pointer-events-none absolute -right-6 -bottom-6 size-28 rounded-full bg-primary/10 blur-xl" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-surface-container-lowest px-2.5 py-1 font-label-sm text-label-sm text-primary shadow-sm">
          <span aria-hidden className="material-symbols-outlined text-[14px]">
            compare_arrows
          </span>
          使い分け・併用分析
        </span>
        <h1 className="relative mt-space-sm font-headline-md text-headline-md font-extrabold tracking-tight text-on-surface lg:font-headline-lg lg:text-headline-lg">
          併用比較
        </h1>
        <p className="relative mt-1 font-body-sm text-body-sm text-on-surface-variant lg:font-body-md lg:text-body-md">
          2つのサブスクを両方使っている人が、それぞれを何に使っているかを比べます。
        </p>
      </header>

      <form className="grid gap-3 rounded-xl bg-surface-container-lowest p-space-md shadow-sm sm:grid-cols-[1fr_auto_1fr] sm:items-end lg:p-space-lg">
        {(["a", "b"] as const).map((k, i) => (
          <label key={k} className={`space-y-1.5 ${i === 1 ? "sm:col-start-3" : ""}`}>
            <span className="font-label-md text-label-md text-on-surface-variant">サービス{i + 1}</span>
            <select name={k} required defaultValue={typeof sp[k] === "string" ? sp[k] : ""} className={selectCls}>
              <option value="" disabled>
                選んでください
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ))}
        <span className="hidden size-8 -rotate-6 items-center justify-center self-center rounded-full bg-primary text-[13px] font-extrabold text-on-primary shadow-md sm:col-start-2 sm:row-start-1 sm:mb-2 sm:flex sm:self-end">
          VS
        </span>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary-container px-space-lg font-headline-sm text-headline-sm font-bold text-on-primary shadow-md transition-opacity hover:opacity-90 sm:col-span-3 dark:text-on-primary-container">
          比べる
          <span aria-hidden className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </form>

      <section aria-labelledby="pairs">
        <div className="mb-space-sm flex items-center gap-2">
          <span aria-hidden className="material-symbols-outlined text-[18px] text-on-surface-variant">
            alt_route
          </span>
          <h2 id="pairs" className="font-headline-sm text-headline-sm font-bold text-on-surface">
            よく併用されている組み合わせ
          </h2>
        </div>
        <PairChips pairs={pairs} />
      </section>
    </div>
  );
}
