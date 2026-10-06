import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PairChips } from "@/components/pair-chips";
import { inputCls, primaryBtn } from "@/components/forms/field";
import { getIndex } from "@/lib/data";
import { pairSlug, topPairs } from "@/lib/stacks";

export const metadata: Metadata = {
  title: "サブスクの併用比較",
  description: "2つのサブスクを両方使っている人が、それぞれを何に使い分けているかを比べられます。",
};

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
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">併用比較</h1>
        <p className="mt-2 text-muted">2つのサブスクを両方使っている人が、それぞれを何に使っているかを比べます。</p>
      </header>
      <form className="grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
        {(["a", "b"] as const).map((k, i) => (
          <label key={k} className={`space-y-1.5 ${i === 1 ? "sm:col-start-3" : ""}`}>
            <span className="text-sm font-bold">サービス{i + 1}</span>
            <select name={k} required defaultValue={typeof sp[k] === "string" ? sp[k] : ""} className={inputCls}>
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
        <span className="hidden pb-3 text-center font-extrabold text-subtle sm:col-start-2 sm:row-start-1 sm:block">×</span>
        <button className={primaryBtn}>比べる</button>
      </form>
      <section>
        <h2 className="mb-3 text-lg font-extrabold">よく併用されている組み合わせ</h2>
        <PairChips pairs={pairs} />
      </section>
    </div>
  );
}
