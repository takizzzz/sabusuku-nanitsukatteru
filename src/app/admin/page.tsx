import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, ActionForm } from "@/components/admin/action-form";
import { DemoNotice } from "@/components/demo-notice";
import {
  approveRequest,
  deletePlan,
  handleReport,
  rejectRequest,
  savePlan,
  saveService,
  setUserStatus,
} from "@/lib/actions/admin";
import { loadAdminData, type AdminData, type AdminService } from "@/lib/admin-data";
import { requireViewer } from "@/lib/auth";
import { getIndex } from "@/lib/data";
import { yen } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/options";

export const metadata: Metadata = { title: "管理画面", robots: { index: false } };

const TABS = [
  { id: "services", label: "サービスマスタ" },
  { id: "requests", label: "追加申請" },
  { id: "affiliate", label: "アフィリエイト" },
  { id: "reports", label: "通報" },
  { id: "users", label: "ユーザー" },
] as const;

const cell = "border-b border-line px-2 py-2 text-left align-top";
const input = "min-h-8 w-full rounded border border-line bg-surface-2 px-2 text-sm";

/** S-16 管理画面（F-21〜F-23）。装飾なしのテーブル中心 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "services";
  const viewer = await requireViewer(`/admin?tab=${tab}`);
  if (viewer.profile?.role !== "admin") notFound();
  const data = await loadAdminData(viewer);
  const openReports = data.reports.filter((r) => r.status === "open").length;
  const openRequests = data.requests.filter((r) => r.status === "open").length;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-extrabold">管理画面</h1>
      {viewer.demo && <DemoNotice>デモ表示中です。ダミーデータを表示しています。保存はできません。</DemoNotice>}
      <nav className="flex flex-wrap gap-1 border-b border-line" aria-label="管理メニュー">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin?tab=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={`min-h-10 px-3 py-2 text-sm font-bold ${tab === t.id ? "border-b-2 border-accent text-accent-strong" : "text-muted"}`}
          >
            {t.label}
            {t.id === "reports" && openReports > 0 && <span className="ml-1 rounded bg-danger px-1.5 text-xs text-white">{openReports}</span>}
            {t.id === "requests" && openRequests > 0 && <span className="ml-1 rounded bg-accent px-1.5 text-xs text-on-accent">{openRequests}</span>}
          </Link>
        ))}
      </nav>
      <div className="overflow-x-auto">
        {tab === "services" && <Services data={data} />}
        {tab === "requests" && <Requests data={data} />}
        {tab === "affiliate" && <Affiliate data={data} />}
        {tab === "reports" && <Reports data={data} />}
        {tab === "users" && <Users data={data} selfId={viewer.userId} />}
      </div>
    </div>
  );
}

function ServiceFields({ s, data }: { s?: AdminService; data: AdminData }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <label className="text-xs">slug<input name="slug" defaultValue={s?.slug} required className={input} /></label>
      <label className="text-xs">サービス名<input name="name" defaultValue={s?.name} required className={input} /></label>
      <label className="text-xs">運営会社<input name="company" defaultValue={s?.company ?? ""} className={input} /></label>
      <label className="text-xs">
        カテゴリ
        <select name="categoryId" defaultValue={s?.categoryId ?? data.categories[0]?.id} className={input}>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs">公式URL<input name="officialUrl" defaultValue={s?.officialUrl ?? ""} className={input} /></label>
      <label className="text-xs">ロゴURL（使用条件を確認済みのもの）<input name="logoUrl" defaultValue={s?.logoUrl ?? ""} className={input} /></label>
      <label className="text-xs">ブランド色<input name="brandColor" defaultValue={s?.brandColor ?? ""} placeholder="#4f46e5" className={input} /></label>
      <label className="text-xs">アフィリエイトURL<input name="affiliateUrl" defaultValue={s?.affiliateUrl ?? ""} className={input} /></label>
      <div className="flex items-end gap-3 text-xs">
        <label className="flex items-center gap-1">
          <input type="checkbox" name="affiliateActive" defaultChecked={s?.affiliateActive} /> アフィリエイト有効
        </label>
        <label>
          状態
          <select name="status" defaultValue={s?.status ?? "active"} className={input}>
            <option value="active">公開</option>
            <option value="pending">保留</option>
            <option value="archived">終了</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function Services({ data }: { data: AdminData }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <details className="rounded border border-line p-3">
        <summary className="cursor-pointer text-sm font-bold">＋ サービスを追加</summary>
        <ActionForm action={saveService} className="mt-3 space-y-3" submitLabel="追加">
          <ServiceFields data={data} />
        </ActionForm>
      </details>
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-xs text-subtle">
            <th className={cell}>サービス</th>
            <th className={cell}>カテゴリ</th>
            <th className={cell}>プラン</th>
            <th className={cell}>状態</th>
          </tr>
        </thead>
        <tbody>
          {data.services.map((s) => (
            <tr key={s.id}>
              <td className={cell}>
                <details>
                  <summary className="cursor-pointer font-bold">{s.name}</summary>
                  <ActionForm action={saveService} className="mt-2 space-y-2">
                    <ServiceFields s={s} data={data} />
                  </ActionForm>
                </details>
                <span className="text-xs text-subtle">{s.slug}</span>
              </td>
              <td className={cell}>{data.categories.find((c) => c.id === s.categoryId)?.name}</td>
              <td className={cell}>
                <ul className="space-y-1">
                  {data.plans
                    .filter((p) => p.serviceId === s.id)
                    .map((p) => (
                      <li key={p.id}>
                        <details>
                          <summary className="cursor-pointer">
                            {p.name} ¥{yen(p.price)}/{p.billingCycle === "yearly" ? "年" : "月"}
                            <span className="ml-1 text-xs text-subtle">（{p.priceCheckedAt}時点）</span>
                          </summary>
                          <ActionForm action={savePlan} className="mt-1 space-y-1">
                            <PlanFields serviceId={s.id} plan={p} today={today} />
                          </ActionForm>
                          <ActionButton action={deletePlan.bind(null, p.id)} label="削除" tone="danger" confirmText={`${p.name} を削除しますか？`} />
                        </details>
                      </li>
                    ))}
                  <li>
                    <details>
                      <summary className="cursor-pointer text-xs text-accent-strong">＋ プラン追加</summary>
                      <ActionForm action={savePlan} className="mt-1 space-y-1" submitLabel="追加">
                        <PlanFields serviceId={s.id} today={today} />
                      </ActionForm>
                    </details>
                  </li>
                </ul>
              </td>
              <td className={cell}>{{ active: "公開", pending: "保留", archived: "終了" }[s.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanFields({ serviceId, plan, today }: { serviceId: string; plan?: AdminData["plans"][number]; today: string }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      <input type="hidden" name="serviceId" value={serviceId} />
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <input name="name" defaultValue={plan?.name} placeholder="プラン名" required className={input} />
      <input name="price" defaultValue={plan?.price} placeholder="価格（円）" inputMode="numeric" required className={input} />
      <select name="billingCycle" defaultValue={plan?.billingCycle ?? "monthly"} className={input}>
        <option value="monthly">月額</option>
        <option value="yearly">年額</option>
      </select>
      <input type="date" name="priceCheckedAt" defaultValue={plan?.priceCheckedAt ?? today} required className={input} />
    </div>
  );
}

function Requests({ data }: { data: AdminData }) {
  if (data.requests.length === 0) return <p className="py-6 text-sm text-muted">申請はまだありません。</p>;
  return (
    <table className="w-full min-w-[720px] text-sm">
      <thead>
        <tr className="text-xs text-subtle">
          <th className={cell}>申請</th>
          <th className={cell}>内容</th>
          <th className={cell}>対応</th>
        </tr>
      </thead>
      <tbody>
        {data.requests.map((r) => (
          <tr key={r.id}>
            <td className={cell}>
              <p className="font-bold">{r.name}</p>
              <p className="text-xs text-subtle">
                {new Date(r.createdAt).toLocaleString("ja-JP")}・@{r.handle ?? "退会済み"}
              </p>
            </td>
            <td className={cell}>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="break-all text-accent-strong underline">
                  {r.url}
                </a>
              )}
              <p className="text-xs">
                {data.categories.find((c) => c.id === r.categoryId)?.name}
                {r.planName && `・${r.planName}`}
                {r.price !== null && `・${r.currency === "USD" ? "$" : "¥"}${r.price}`}
              </p>
              {r.comment && <p className="text-xs text-muted">{r.comment}</p>}
            </td>
            <td className={cell}>
              {r.status === "open" ? (
                <div className="space-y-2">
                  <ActionForm action={approveRequest} className="space-y-1" submitLabel="承認してマスタに追加">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="url" value={r.url ?? ""} />
                    <div className="grid grid-cols-2 gap-1">
                      <input name="slug" placeholder="slug" required className={input} />
                      <input name="name" defaultValue={r.name} required className={input} />
                      <input name="company" placeholder="運営会社" className={input} />
                      <select name="categoryId" defaultValue={r.categoryId ?? undefined} className={input}>
                        {data.categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </ActionForm>
                  <ActionButton action={rejectRequest.bind(null, r.id)} label="却下" tone="danger" confirmText="この申請を却下しますか？" />
                </div>
              ) : (
                <span className="text-xs text-subtle">{r.status === "approved" ? "承認済み" : "却下"}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Affiliate({ data }: { data: AdminData }) {
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="text-xs text-subtle">
          <th className={cell}>サービス</th>
          <th className={cell}>リンク</th>
          <th className={cell}>有効</th>
          <th className={`${cell} text-right`}>クリック（30日）</th>
          <th className={`${cell} text-right`}>クリック（90日）</th>
        </tr>
      </thead>
      <tbody>
        {[...data.services]
          .sort((a, b) => (data.clicks.get(b.id)?.d30 ?? 0) - (data.clicks.get(a.id)?.d30 ?? 0))
          .map((s) => (
            <tr key={s.id}>
              <td className={cell}>{s.name}</td>
              <td className={`${cell} max-w-64 truncate text-xs`}>{s.affiliateUrl ?? "—"}</td>
              <td className={cell}>{s.affiliateActive && s.affiliateUrl ? "有効" : "—"}</td>
              <td className={`${cell} num text-right`}>{data.clicks.get(s.id)?.d30 ?? 0}</td>
              <td className={`${cell} num text-right`}>{data.clicks.get(s.id)?.d90 ?? 0}</td>
            </tr>
          ))}
      </tbody>
      <caption className="caption-bottom pt-2 text-left text-xs text-subtle">リンクの編集はサービスマスタのタブで行います。</caption>
    </table>
  );
}

async function Reports({ data }: { data: AdminData }) {
  if (data.reports.length === 0) return <p className="py-6 text-sm text-muted">通報はまだありません。</p>;
  const idx = await getIndex();
  const handleOf = (type: string, id: string) => {
    const userId = type === "comment" ? idx.ds.subscriptions.find((s) => s.id === id)?.userId : id;
    return data.users.find((u) => u.id === userId)?.handle ?? null;
  };
  return (
    <table className="w-full min-w-[720px] text-sm">
      <thead>
        <tr className="text-xs text-subtle">
          <th className={cell}>日時</th>
          <th className={cell}>対象</th>
          <th className={cell}>理由</th>
          <th className={cell}>対応</th>
        </tr>
      </thead>
      <tbody>
        {[...data.reports]
          .sort((a, b) => Number(b.status === "open") - Number(a.status === "open"))
          .map((r) => {
            const handle = handleOf(r.targetType, r.targetId);
            return (
              <tr key={r.id} className={r.status === "open" ? "" : "text-subtle"}>
                <td className={cell}>
                  {new Date(r.createdAt).toLocaleString("ja-JP")}
                  <p className="text-xs">通報者 @{r.reporter ?? "退会済み"}</p>
                </td>
                <td className={cell}>
                  {r.targetType === "comment" ? "コメント" : "構成"}：
                  {handle ? <Link href={`/@${handle}`} className="text-accent-strong underline">@{handle}</Link> : <span className="text-xs">{r.targetId}（非表示か削除済み）</span>}
                </td>
                <td className={cell}>
                  {REPORT_REASONS.find((x) => x.id === r.reason)?.label ?? r.reason}
                  {r.detail && <p className="text-xs text-muted">{r.detail}</p>}
                </td>
                <td className={cell}>
                  {r.status === "open" ? (
                    <div className="flex flex-wrap gap-1">
                      <ActionButton action={handleReport.bind(null, r.id, "hide")} label="非表示にする" tone="danger" confirmText="対象を非表示にしますか？" />
                      <ActionButton action={handleReport.bind(null, r.id, "resolve")} label="対応済み" />
                      <ActionButton action={handleReport.bind(null, r.id, "dismiss")} label="対応不要" />
                    </div>
                  ) : (
                    <span className="text-xs">{r.status === "resolved" ? "対応済み" : "対応不要"}</span>
                  )}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

function Users({ data, selfId }: { data: AdminData; selfId: string }) {
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="text-xs text-subtle">
          <th className={cell}>ユーザー</th>
          <th className={cell}>公開範囲</th>
          <th className={cell}>登録日</th>
          <th className={cell}>状態</th>
        </tr>
      </thead>
      <tbody>
        {data.users.map((u) => (
          <tr key={u.id}>
            <td className={cell}>
              <Link href={`/@${u.handle}`} className="font-bold hover:underline">
                {u.displayName}
              </Link>
              <span className="ml-1 text-xs text-subtle">@{u.handle}</span>
              {u.role === "admin" && <span className="ml-1 rounded bg-accent-soft px-1 text-xs">管理者</span>}
            </td>
            <td className={cell}>{{ public: "公開", unlisted: "限定公開", private: "非公開" }[u.visibility]}</td>
            <td className={cell}>{new Date(u.createdAt).toLocaleDateString("ja-JP")}</td>
            <td className={cell}>
              {u.status === "suspended" ? <span className="mr-2 font-bold text-danger">停止中</span> : <span className="mr-2">利用中</span>}
              {u.id !== selfId &&
                (u.status === "active" ? (
                  <ActionButton action={setUserStatus.bind(null, u.id, "suspended")} label="停止する" tone="danger" confirmText={`@${u.handle} を利用停止にしますか？`} />
                ) : (
                  <ActionButton action={setUserStatus.bind(null, u.id, "active")} label="停止を解除" />
                ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
