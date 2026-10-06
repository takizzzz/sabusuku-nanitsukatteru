import type { Metadata } from "next";
import { CirclePlus } from "lucide-react";
import { DemoNotice } from "@/components/demo-notice";
import { ServiceRequestForm } from "@/components/forms/service-request-form";
import { requireViewer } from "@/lib/auth";
import { getIndex } from "@/lib/data";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "サービス追加の申請", robots: { index: false } };

const STATUS = { open: "確認中", approved: "追加済み", rejected: "見送り" } as const;

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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="flex gap-4 rounded-2xl bg-accent-soft/60 p-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
          <CirclePlus className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">サービス追加の申請</h1>
          <p className="mt-1 text-sm text-muted">使っているサブスクが見つからないときは、サービス名と公式サイトを教えてください。</p>
        </div>
      </header>
      {viewer.demo && <DemoNotice>デモ表示中です。申請は送信されません。</DemoNotice>}
      <ServiceRequestForm categories={categories} initialName={typeof sp.name === "string" ? sp.name.slice(0, 50) : ""} />
      {mine.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-extrabold">あなたの申請</h2>
          <ul className="divide-y divide-line text-sm">
            {mine.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="font-bold">{r.name}</span>
                <span className="text-xs text-subtle">
                  {new Date(r.created_at).toLocaleDateString("ja-JP")}・{STATUS[r.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
