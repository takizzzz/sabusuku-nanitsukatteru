import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CirclePlus, MessageSquareText } from "lucide-react";
import { AffiliateLink } from "@/components/affiliate-link";
import { Avatar } from "@/components/avatar";
import { CategoryBar } from "@/components/category-bar";
import { Price } from "@/components/price";
import { ServiceLogo } from "@/components/service-logo";
import { ShareButtons } from "@/components/share-buttons";
import { StackActions } from "@/components/stack-actions";
import { StackCard } from "@/components/stack-card";
import { Stars } from "@/components/stars";
import { Tag } from "@/components/tag";
import { getIndex } from "@/lib/data";
import { SITE_NAME, SITE_URL, yearMonth, yen } from "@/lib/format";
import { findStack, similarStacks, type Stack } from "@/lib/stacks";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const stack = findStack(await getIndex(), handle);
  if (!stack) return {};
  const names = stack.active.map((e) => e.service.name).slice(0, 5).join("・");
  const title = `@${handle} のサブスク 月¥${yen(stack.monthlyTotal)}`;
  return {
    title,
    description: `${stack.profile.occupation ?? ""}の @${handle} さんが契約中のサブスク${stack.active.length}件（${names}）と使い分け。`,
    alternates: { canonical: `/@${handle}` },
    robots: stack.profile.visibility === "unlisted" ? { index: false, follow: false } : undefined,
    openGraph: { title, url: `/@${handle}` },
    twitter: { card: "summary_large_image", title },
  };
}

export default async function StackPage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const idx = await getIndex();
  const stack = findStack(idx, handle);
  if (!stack) notFound();

  const { profile } = stack;
  const similar = profile.visibility === "public" ? similarStacks(idx, stack, 3) : [];
  const url = `${SITE_URL}/@${profile.handle}`;
  const priceDate = stack.active
    .map((e) => e.plan?.priceCheckedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* プロフィール */}
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 md:flex-row md:items-start">
        <Avatar profile={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold">
            {profile.displayName}
            <span className="ml-2 text-sm font-semibold text-subtle">@{profile.handle}</span>
          </h1>
          <p className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold">
            {profile.occupation && <span className="rounded bg-accent-soft px-2 py-0.5 text-accent-strong">{profile.occupation}</span>}
            {profile.ageRange && <span className="rounded bg-surface-2 px-2 py-0.5">{profile.ageRange}</span>}
            {profile.visibility === "unlisted" && <span className="rounded bg-surface-2 px-2 py-0.5 text-subtle">限定公開</span>}
          </p>
          {profile.bio && <p className="mt-3 text-sm text-muted">{profile.bio}</p>}
          <p className="mt-2 flex flex-wrap gap-x-3">
            {profile.tags.map((t) => (
              <Tag key={t} name={t} href={`/stacks?tags=${encodeURIComponent(t)}`} />
            ))}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <StackActions targetUserId={profile.id} handle={profile.handle} initialCount={stack.likeCount} />
          <ShareButtons
            url={url}
            text={`@${profile.handle} さんのサブスクは月¥${yen(stack.monthlyTotal)}！ #さぶすくなにつかってる`}
            reportHref={`/report?type=stack&id=${profile.id}`}
          />
        </div>
      </section>

      {/* サマリー */}
      <section className="grid gap-4 md:grid-cols-[3fr_2fr]" aria-label="サマリー">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-bold text-subtle">月額合計</p>
          <Price value={stack.monthlyTotal} size="xl" className="mt-1" />
          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4">
            <div>
              <dt className="text-xs text-subtle">年額換算</dt>
              <dd>
                <Price value={stack.monthlyTotal * 12} size="md" unit="/年" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">契約数</dt>
              <dd className="font-bold">
                <span className="num text-xl font-extrabold">{stack.active.length}</span> 件契約中
                {stack.cancelled.length > 0 && <span className="text-sm text-subtle"> / {stack.cancelled.length}件解約</span>}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="mb-4 text-sm font-bold">カテゴリ別の内訳</p>
          <CategoryBar shares={stack.categoryShares} />
        </div>
      </section>

      {/* 契約中 */}
      <section>
        <h2 className="mb-3 text-xl font-extrabold">
          契約中のサブスク <span className="num text-base text-subtle">{stack.active.length}件</span>
        </h2>
        <ul className="space-y-3">
          {stack.active.map((e) => (
            <li key={e.sub.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-start gap-3">
                <ServiceLogo service={e.service} size="lg" />
                <div className="min-w-0 flex-1">
                  <Link href={`/services/${e.service.slug}`} className="font-bold hover:underline">
                    {e.service.name}
                  </Link>
                  <p className="text-xs text-subtle">
                    {[e.service.company, e.plan?.name && `${e.plan.name}プラン`].filter(Boolean).join("・")}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {e.sub.satisfaction && <Stars value={e.sub.satisfaction} />}
                    {e.sub.tags.map((t) => (
                      <Tag key={t} name={t} />
                    ))}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Price value={e.sub.monthlyPrice} size="lg" />
                  {e.plan?.billingCycle === "yearly" && <span className="text-[11px] text-subtle">年額プランを月割り</span>}
                  <AffiliateLink service={e.service} from={`stack:${profile.handle}`} />
                </div>
              </div>
              {e.sub.comment && (
                <details className="group mt-3 rounded-xl bg-surface-2 px-4 py-3" open>
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold text-subtle">
                    <MessageSquareText className="size-3.5" aria-hidden />
                    使い分けコメント
                  </summary>
                  <p className="mt-1.5 text-sm">{e.sub.comment}</p>
                  <p className="mt-1 flex items-center justify-between gap-2 text-xs text-subtle">
                    <span>{e.sub.startedOn && `${yearMonth(e.sub.startedOn)}から利用`}</span>
                    <Link href={`/report?type=comment&id=${e.sub.id}`} className="hover:underline">
                      通報
                    </Link>
                  </p>
                </details>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-subtle">
          月額は本人の申告値です。{priceDate && `プランの参考価格は${yearMonth(priceDate.slice(0, 7))}時点。`}
          「PR」が付いたリンクはアフィリエイトリンクです。
        </p>
      </section>

      {/* 解約済み */}
      {stack.cancelled.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-extrabold text-subtle">
            解約したサブスク <span className="num text-base">{stack.cancelled.length}件</span>
          </h2>
          <ul className="space-y-3">
            {stack.cancelled.map((e) => (
              <li key={e.sub.id} className="rounded-2xl border border-dashed border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="opacity-50 grayscale">
                    <ServiceLogo service={e.service} />
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-subtle line-through">{e.service.name}</p>
                    <p className="text-xs text-subtle">
                      {yearMonth(e.sub.cancelledOn)}に解約・解約時 ¥{yen(e.sub.monthlyPrice)}/月
                    </p>
                  </div>
                  {e.switchedTo && (
                    <Link
                      href={`/services/${e.switchedTo.slug}`}
                      className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-bold"
                    >
                      {e.service.name}
                      <ArrowRight className="size-3" aria-label="から" />
                      {e.switchedTo.name}
                    </Link>
                  )}
                </div>
                {(e.sub.cancelReason || e.sub.cancelReasonDetail) && (
                  <p className="mt-3 rounded-xl bg-surface px-4 py-3 text-sm">
                    {e.sub.cancelReason && <span className="mr-2 font-bold">{e.sub.cancelReason}</span>}
                    {e.sub.cancelReasonDetail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* OGP プレビュー＋登録CTA */}
      <section className="grid items-center gap-6 rounded-3xl bg-surface-3 p-6 md:grid-cols-2">
        <OgpPreview stack={stack} />
        <div>
          <p className="text-xl font-extrabold">あなたも自分のサブスク構成を公開してみませんか？</p>
          <p className="mt-2 text-sm text-muted">サービスを選んで月額を入れるだけ。こんなカードが自動でできて、そのままシェアできます。</p>
          <Link href="/welcome" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-on-accent">
            <CirclePlus className="size-5" aria-hidden />
            自分の構成を登録する（無料）
          </Link>
        </div>
      </section>

      {similar.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-extrabold">似た構成の人</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {similar.map((s) => (
              <StackCard key={s.profile.id} stack={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OgpPreview({ stack }: { stack: Stack }) {
  return (
    <div className="aspect-[1200/630] rounded-2xl bg-surface p-5 shadow-md">
      <p className="text-xs font-extrabold text-accent-strong">{SITE_NAME}</p>
      <p className="mt-3 font-bold">{stack.profile.displayName} さんのサブスク</p>
      <Price value={stack.monthlyTotal} size="lg" className="mt-1" />
      <div className="mt-3 flex flex-wrap gap-1">
        {stack.active.slice(0, 12).map((e) => (
          <ServiceLogo key={e.sub.id} service={e.service} size="sm" />
        ))}
      </div>
    </div>
  );
}
