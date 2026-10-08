import Link from "next/link";
import { ArrowDown, CirclePlus } from "lucide-react";
import { Price } from "@/components/price";
import { Section } from "@/components/section";
import { ServiceRow } from "@/components/service-row";
import { StackCard } from "@/components/stack-card";
import { getIndex } from "@/lib/data";
import { percent, yen } from "@/lib/format";
import { buildStack, listableProfiles, ranking, siteStats } from "@/lib/stacks";

export const revalidate = 300;

export default async function TopPage() {
  const idx = await getIndex();
  const stacks = listableProfiles(idx)
    .map((p) => buildStack(idx, p))
    .filter((s) => s.active.length > 0);
  const popular = [...stacks].sort((a, b) => b.likeCount - a.likeCount).slice(0, 6);
  const newest = [...stacks]
    .sort((a, b) => b.profile.updatedAt.localeCompare(a.profile.updatedAt))
    .slice(0, 6);
  const stats = siteStats(idx);
  const aiRanking = ranking(idx, "users", { categorySlug: "ai", limit: 5 });
  const categories = [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-12 pb-8">
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-accent-soft/60 to-bg">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16">
          <p className="inline-block rounded-full bg-card px-3 py-1 text-xs font-bold text-accent-strong">
            リアルな月額と使い分けをオープンに
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
            みんな、サブスク
            <br />
            <span className="text-accent-strong">なにつかってる！？</span>
          </h1>
          <p className="mt-4 max-w-xl text-muted md:text-lg">
            生成AIから動画・音楽まで。みんなの契約一覧と「どう使い分けているか」がひと目でわかります。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/welcome"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-on-accent shadow-md hover:bg-accent-strong"
            >
              <CirclePlus className="size-5" aria-hidden />
              自分のサブスクを登録する
            </Link>
            <Link
              href="#popular"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-line bg-card px-6 font-bold hover:border-accent"
            >
              みんなの構成を見る
              <ArrowDown className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* 全体統計 */}
      <section className="mx-auto max-w-6xl px-4" aria-label="全体の統計">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="公開された構成">
            <span className="num text-3xl font-extrabold">{yen(stats.stackCount)}</span>
            <span className="ml-1 text-sm font-bold">件</span>
          </Stat>
          <Stat label="平均月額" note={`中央値 ¥${yen(stats.medianMonthly)}`}>
            <Price value={stats.avgMonthly} size="lg" />
          </Stat>
          <Stat
            label="いちばん使われている"
            note={stats.topService ? `利用率 ${percent(stats.topService.usageRate)}` : undefined}
          >
            <span className="text-lg font-extrabold">{stats.topService?.service.name ?? "—"}</span>
          </Stat>
          <Stat label="解約・見直しの記録">
            <span className="num text-3xl font-extrabold">{yen(stats.cancelCount)}</span>
            <span className="ml-1 text-sm font-bold">件</span>
          </Stat>
        </dl>
      </section>

      {/* カテゴリ */}
      <nav aria-label="カテゴリ" className="mx-auto max-w-6xl px-4">
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/ranking?category=${c.slug}`}
                className="flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-bold whitespace-nowrap hover:border-accent"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <Section title="人気の構成" more={{ href: "/stacks", label: "もっと見る" }}>
        <div id="popular" className="grid scroll-mt-20 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popular.map((s) => (
            <StackCard key={s.profile.id} stack={s} />
          ))}
        </div>
      </Section>

      <Section title="生成AIのランキング" more={{ href: "/ranking?category=ai", label: "ランキングを見る" }}>
        <div className="rounded-2xl border border-line bg-card p-2">
          {aiRanking.map((s, i) => (
            <ServiceRow key={s.service.id} stat={s} rank={i + 1} />
          ))}
        </div>
        <p className="mt-2 text-xs text-subtle">
          利用者数順。順位は広告・アフィリエイトの有無に関係なく、登録データだけで決めています。
        </p>
      </Section>

      <Section title="新着の構成" more={{ href: "/stacks?sort=new", label: "もっと見る" }}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {newest.map((s) => (
            <StackCard key={s.profile.id} stack={s} showComment={false} />
          ))}
        </div>
      </Section>

      {/* 登録CTA */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl bg-accent px-6 py-10 text-on-accent md:px-12">
          <p className="text-sm font-bold opacity-80">SHARE YOUR STACK</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-4xl">あなたのサブスク、いくら？</h2>
          <p className="mt-3 max-w-lg opacity-90">
            人気のサービスを選んで月額を入れるだけ。合計額のカード画像が自動でできて、X や LINE でシェアできます。無駄遣いの見直しにも。
          </p>
          <Link
            href="/welcome"
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-card px-6 font-bold text-accent-strong"
          >
            今すぐ自分の構成をつくる
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <dt className="text-xs font-bold text-subtle">{label}</dt>
      <dd className="mt-1">{children}</dd>
      {note && <dd className="mt-0.5 text-xs text-subtle">{note}</dd>}
    </div>
  );
}
