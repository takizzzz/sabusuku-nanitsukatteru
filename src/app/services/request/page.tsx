import type { Metadata } from "next";
import { DemoNotice } from "@/components/demo-notice";
import { ServiceRequestForm } from "@/components/forms/service-request-form";
import { requireViewer } from "@/lib/auth";
import { getIndex } from "@/lib/data";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "サービス追加の申請", robots: { index: false } };

const STATUS = {
  open: { label: "確認中", cls: "bg-surface-container-high text-on-surface-variant" },
  approved: { label: "追加済み", cls: "bg-secondary-fixed text-on-secondary-fixed-variant" },
  rejected: { label: "見送り", cls: "bg-surface-container-highest text-outline" },
} as const;

/** S-12 サービス追加申請（F-08） */
export default async function ServiceRequestPage({ searchParams }: PageProps<"/services/request">) {
  const sp = await searchParams;
  const viewer = await requireViewer("/services/request");
  const idx = await getIndex();
  const categories = [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder);

  let mine: { id: string; name: string; status: keyof typeof STATUS; created_at: string }[] = [];
  if (!viewer.demo) {
    const db = await createSupabaseServer();
    const { data } = await db
      .from("service_requests")
      .select("id, name, status, created_at")
      .eq("user_id", viewer.userId)
      .order("created_at", { ascending: false })
      .limit(10);
    mine = data ?? [];
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-space-md px-gutter-mobile md:px-margin-mobile pt-space-md pb-10 md:pt-space-xl">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-fixed to-surface-container-high p-space-md md:p-space-lg shadow-sm">
        <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" aria-hidden />
        <div className="flex items-start gap-space-sm relative z-10">
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <span className="material-symbols-outlined fill text-[20px]" aria-hidden>
              add_circle
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline-sm text-headline-sm md:font-headline-md md:text-headline-md text-on-surface font-bold mb-1">サービス追加の申請</h1>
            <p className="font-body-sm text-body-sm md:text-body-md text-on-surface-variant leading-relaxed">
              使っているサブスクが見つからないときは、サービス名と公式サイトを教えてください。
            </p>
          </div>
        </div>
      </section>

      {viewer.demo && <DemoNotice>デモ表示中です。申請は送信されません。</DemoNotice>}

      <ServiceRequestForm categories={categories} initialName={typeof sp.name === "string" ? sp.name.slice(0, 50) : ""} />

      {mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden>
              history
            </span>
            <h2 className="font-label-sm text-label-sm tracking-wide">あなたの申請</h2>
          </div>
          <ul className="bg-surface-container-lowest rounded-xl shadow-sm divide-y divide-surface-container">
            {mine.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-space-sm px-space-md py-3">
                <span className="font-label-md text-label-md text-on-surface font-bold truncate">{r.name}</span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="num font-body-sm text-body-sm text-on-surface-variant">{new Date(r.created_at).toLocaleDateString("ja-JP")}</span>
                  <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
