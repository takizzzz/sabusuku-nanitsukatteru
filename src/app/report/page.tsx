import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoNotice } from "@/components/demo-notice";
import { ReportForm } from "@/components/forms/report-form";
import { requireViewer } from "@/lib/auth";
import { getIndex } from "@/lib/data";
import { yen } from "@/lib/format";
import { buildStack } from "@/lib/stacks";

export const metadata: Metadata = { title: "通報", robots: { index: false } };

/** S-15 通報（F-20）。構成か、使い方コメント（契約行）を対象にする */
export default async function ReportPage({ searchParams }: PageProps<"/report">) {
  const sp = await searchParams;
  const type = sp.type === "comment" ? "comment" : "stack";
  const id = typeof sp.id === "string" ? sp.id : "";
  const viewer = await requireViewer(`/report?type=${type}&id=${encodeURIComponent(id)}`);
  const idx = await getIndex();

  let target: { owner: string; title: string; quote?: string; back: string } | null = null;
  if (type === "stack") {
    const profile = idx.ds.profiles.find((p) => p.id === id);
    if (profile) {
      const s = buildStack(idx, profile);
      target = { owner: profile.handle, title: `${profile.displayName} さんのサブスク構成（月¥${yen(s.monthlyTotal)}・${s.active.length}件）`, back: `/@${profile.handle}` };
    }
  } else {
    const sub = idx.ds.subscriptions.find((s) => s.id === id && !s.isHidden);
    const profile = sub && idx.ds.profiles.find((p) => p.id === sub.userId);
    const service = sub && idx.services.get(sub.serviceId);
    if (sub && profile && service)
      target = {
        owner: profile.handle,
        title: `${service.name} の使い方コメント`,
        quote: sub.comment ?? sub.cancelReasonDetail ?? undefined,
        back: `/@${profile.handle}`,
      };
  }
  if (!target) notFound();

  return (
    <div className="mx-auto w-full max-w-xl px-margin-mobile py-space-md md:py-space-xl space-y-space-md">
      <div className="flex flex-col items-center justify-center pt-space-xs pb-space-xs">
        <div className="w-10 h-1 rounded-full bg-outline-variant/60 mb-space-sm md:hidden" aria-hidden />
        <h1 className="flex items-center gap-space-xs text-error font-headline-sm text-headline-sm md:font-headline-md md:text-headline-md">
          <span className="material-symbols-outlined fill text-[22px]" aria-hidden>
            report
          </span>
          <span>コンテンツの通報</span>
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-space-xs max-w-[280px] md:max-w-none">問題のある内容を運営に知らせてください。</p>
      </div>
      {viewer.demo && <DemoNotice>デモ表示中です。通報は送信されません。</DemoNotice>}
      <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden" aria-label="通報の対象">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error" aria-hidden />
        <div className="flex items-center gap-space-xs mb-space-xs min-w-0">
          <div className="w-6 h-6 rounded-full bg-error-container text-on-error-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[14px]" aria-hidden>
              warning
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold tracking-wider">通報の対象</span>
        </div>
        <div className="mt-space-xs pl-space-xs">
          <div className="flex items-center gap-space-xs mb-1 min-w-0">
            <span className="font-label-md text-label-md text-primary font-bold truncate">@{target.owner}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex-shrink-0">さんの投稿</span>
          </div>
          <p className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug line-clamp-2">{target.title}</p>
          {target.quote && (
            <blockquote className="mt-space-sm border-l-2 border-outline-variant pl-3 font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{target.quote}</blockquote>
          )}
        </div>
      </section>
      <ReportForm type={type} targetId={id} backHref={target.back} />
    </div>
  );
}
