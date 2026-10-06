import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert } from "lucide-react";
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
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <header className="space-y-2 text-center">
        <h1 className="flex items-center justify-center gap-2 text-xl font-extrabold text-danger">
          <CircleAlert className="size-6" aria-hidden />
          コンテンツの通報
        </h1>
        <p className="text-sm text-muted">問題のある内容を運営に知らせてください。</p>
      </header>
      {viewer.demo && <DemoNotice>デモ表示中です。通報は送信されません。</DemoNotice>}
      <section className="rounded-2xl border-l-4 border-danger bg-surface-2 p-4" aria-label="通報の対象">
        <p className="text-xs font-bold text-subtle">通報の対象</p>
        <p className="mt-1 text-sm">
          <span className="font-bold text-accent-strong">@{target.owner}</span> さんの投稿
        </p>
        <p className="mt-1 font-extrabold">{target.title}</p>
        {target.quote && <blockquote className="mt-2 border-l-2 border-line pl-3 text-sm text-muted">{target.quote}</blockquote>}
      </section>
      <ReportForm type={type} targetId={id} backHref={target.back} />
    </div>
  );
}
