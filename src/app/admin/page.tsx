import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButton, ActionForm } from "@/components/admin/action-form";
import { Icon } from "@/components/catalog/ui";
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
  { id: "services", label: "サービスマスタ", icon: "apps" },
  { id: "requests", label: "追加申請", icon: "playlist_add" },
  { id: "affiliate", label: "アフィリエイト", icon: "link" },
  { id: "reports", label: "通報", icon: "flag" },
  { id: "users", label: "ユーザー", icon: "group" },
] as const;

const cell = "border-b border-surface-container px-3 py-2.5 text-left align-top";
const head = "border-b border-surface-container bg-surface-container-low px-3 py-2 text-left align-top font-label-sm text-label-sm font-semibold text-on-surface-variant";
const input =
  "mt-0.5 min-h-9 w-full rounded-lg bg-surface-container-low px-2.5 font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-outline focus:bg-surface-container-high focus:outline-none";
const label = "block font-label-sm text-label-sm text-on-surface-variant";
const table = "w-full font-body-sm text-body-sm text-on-surface";
const sub = "font-label-sm text-label-sm font-normal text-outline";
const link = "text-primary underline-offset-2 hover:underline";

const STATUS_LABEL = { active: "公開", pending: "保留", archived: "終了" } as const;
const STATUS_TONE = {
  active: "bg-primary-fixed text-on-primary-fixed-variant",
  pending: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  archived: "bg-surface-container text-outline",
} as const;

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold whitespace-nowrap ${className}`}>{children}</span>;
}

function Empty({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-space-lg text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-container">
        <Icon name={icon} className="text-[24px] text-outline" />
      </span>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{children}</p>
    </div>
  );
}

/** S-16 管理画面（F-21〜F-23）。テーブル中心 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "services";
  const viewer = await requireViewer(`/admin?tab=${tab}`);
  if (viewer.profile?.role !== "admin") notFound();
  const data = await loadAdminData(viewer);
  const openReports = data.reports.filter((r) => r.status === "open").length;
  const openRequests = data.requests.filter((r) => r.status === "open").length;
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="flex w-full flex-col pb-10">
      <section className="w-full md:bg-surface-container-low md:py-space-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-margin-mobile pt-3 pb-4 md:px-margin md:py-0">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm text-on-primary-fixed">
            <Icon name="admin_panel_settings" className="text-[14px] md:text-[15px]" />
            <span>Admin Console</span>
          </span>
          <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface md:font-headline-lg md:text-headline-lg">管理画面</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant md:font-body-md md:text-body-md">
            サービスマスタ・追加申請・アフィリエイト・通報・ユーザーを管理します。
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-space-md px-margin-mobile md:px-margin md:pt-space-lg">
        {viewer.demo && <DemoNotice>デモ表示中です。ダミーデータを表示しています。保存はできません。</DemoNotice>}
        <nav aria-label="管理メニュー" className="-mx-margin-mobile md:mx-0">
          <ul className="no-scrollbar flex items-center gap-1 overflow-x-auto px-margin-mobile md:inline-flex md:rounded-lg md:bg-surface-container md:p-1 md:px-1">
            {TABS.map((t) => {
              const on = tab === t.id;
              const badge = t.id === "reports" ? openReports : t.id === "requests" ? openRequests : 0;
              return (
                <li key={t.id}>
                  <Link
                    href={`/admin?tab=${t.id}`}
                    aria-current={on ? "page" : undefined}
                    className={`flex h-9 shrink-0 items-center gap-1 rounded-md px-3 font-label-md text-label-md whitespace-nowrap transition-colors ${
                      on
                        ? "bg-primary-container font-bold text-white shadow-sm md:bg-surface-container-lowest md:text-primary"
                        : "bg-surface-container-lowest font-medium text-on-surface-variant shadow-sm hover:text-on-surface md:bg-transparent md:shadow-none"
                    }`}
                  >
                    <Icon name={t.icon} className={`text-[16px] ${on ? "fill" : ""}`} />
                    {t.label}
                    {badge > 0 && (
                      <span
                        className={`num ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                          t.id === "reports" ? "bg-error text-on-error" : "bg-primary text-on-primary dark:bg-primary-container dark:text-white"
                        }`}
                      >
                        {badge}
                        <span className="sr-only">件未対応</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <section aria-label={current.label} className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          {tab === "services" && <Services data={data} />}
          {tab === "requests" && <Requests data={data} />}
          {tab === "affiliate" && <Affiliate data={data} />}
          {tab === "reports" && <Reports data={data} />}
          {tab === "users" && <Users data={data} selfId={viewer.userId} />}
        </section>
      </div>
    </div>
  );
}

function ServiceFields({ s, data }: { s?: AdminService; data: AdminData }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <label className={label}>slug<input name="slug" defaultValue={s?.slug} required className={input} /></label>
      <label className={label}>サービス名<input name="name" defaultValue={s?.name} required className={input} /></label>
      <label className={label}>運営会社<input name="company" defaultValue={s?.company ?? ""} className={input} /></label>
      <label className={label}>
        カテゴリ
        <select name="categoryId" defaultValue={s?.categoryId ?? data.categories[0]?.id} className={input}>
          {data.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className={label}>公式URL<input name="officialUrl" defaultValue={s?.officialUrl ?? ""} className={input} /></label>
      <label className={label}>ロゴURL（使用条件を確認済みのもの）<input name="logoUrl" defaultValue={s?.logoUrl ?? ""} className={input} /></label>
      <label className={label}>ブランド色<input name="brandColor" defaultValue={s?.brandColor ?? ""} placeholder="#4f46e5" className={input} /></label>
      <label className={label}>アフィリエイトURL<input name="affiliateUrl" defaultValue={s?.affiliateUrl ?? ""} className={input} /></label>
      <div className="flex items-end gap-3">
        <label className="flex min-h-9 items-center gap-1.5 font-label-sm text-label-sm text-on-surface">
          <input type="checkbox" name="affiliateActive" defaultChecked={s?.affiliateActive} className="size-4 accent-primary-container" /> アフィリエイト有効
        </label>
        <label className={`${label} flex-1`}>
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
    <div>
      <details className="group border-b border-surface-container p-space-md">
        <summary className="flex cursor-pointer list-none items-center gap-1 font-label-md text-label-md font-bold text-primary [&::-webkit-details-marker]:hidden">
          <Icon name="add_circle" className="text-[18px]" />
          サービスを追加
          <Icon name="expand_more" className="text-[18px] transition-transform group-open:rotate-180" />
        </summary>
        <ActionForm action={saveService} className="mt-3 space-y-3 rounded-lg bg-surface-container-low/50 p-3" submitLabel="追加">
          <ServiceFields data={data} />
        </ActionForm>
      </details>
      <div className="overflow-x-auto">
        <table className={`${table} min-w-[720px]`}>
          <thead>
            <tr>
              <th className={head}>サービス</th>
              <th className={head}>カテゴリ</th>
              <th className={head}>プラン</th>
              <th className={head}>状態</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low/50">
                <td className={cell}>
                  <details>
                    <summary className="cursor-pointer font-headline-sm text-headline-sm text-on-surface hover:text-primary">{s.name}</summary>
                    <ActionForm action={saveService} className="mt-2 space-y-2 rounded-lg bg-surface-container-low/50 p-3">
                      <ServiceFields s={s} data={data} />
                    </ActionForm>
                  </details>
                  <span className={sub}>{s.slug}</span>
                </td>
                <td className={`${cell} text-on-surface-variant`}>{data.categories.find((c) => c.id === s.categoryId)?.name}</td>
                <td className={cell}>
                  <ul className="space-y-1">
                    {data.plans
                      .filter((p) => p.serviceId === s.id)
                      .map((p) => (
                        <li key={p.id}>
                          <details>
                            <summary className="cursor-pointer">
                              {p.name} <span className="num font-bold">¥{yen(p.price)}</span>/{p.billingCycle === "yearly" ? "年" : "月"}
                              <span className={`ml-1 ${sub}`}>（{p.priceCheckedAt}時点）</span>
                            </summary>
                            <div className="mt-1 space-y-1.5 rounded-lg bg-surface-container-low/50 p-2">
                              <ActionForm action={savePlan} className="space-y-1.5">
                                <PlanFields serviceId={s.id} plan={p} today={today} />
                              </ActionForm>
                              <ActionButton action={deletePlan.bind(null, p.id)} label="削除" tone="danger" confirmText={`${p.name} を削除しますか？`} />
                            </div>
                          </details>
                        </li>
                      ))}
                    <li>
                      <details>
                        <summary className="inline-flex cursor-pointer items-center gap-0.5 font-label-sm text-label-sm font-bold text-primary">
                          <Icon name="add" className="text-[14px]" />
                          プラン追加
                        </summary>
                        <ActionForm action={savePlan} className="mt-1 space-y-1.5 rounded-lg bg-surface-container-low/50 p-2" submitLabel="追加">
                          <PlanFields serviceId={s.id} today={today} />
                        </ActionForm>
                      </details>
                    </li>
                  </ul>
                </td>
                <td className={cell}>
                  <Badge className={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanFields({ serviceId, plan, today }: { serviceId: string; plan?: AdminData["plans"][number]; today: string }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <input type="hidden" name="serviceId" value={serviceId} />
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <input name="name" defaultValue={plan?.name} placeholder="プラン名" aria-label="プラン名" required className={input} />
      <input name="price" defaultValue={plan?.price} placeholder="価格（円）" aria-label="価格（円）" inputMode="numeric" required className={input} />
      <select name="billingCycle" defaultValue={plan?.billingCycle ?? "monthly"} aria-label="支払い周期" className={input}>
        <option value="monthly">月額</option>
        <option value="yearly">年額</option>
      </select>
      <input type="date" name="priceCheckedAt" defaultValue={plan?.priceCheckedAt ?? today} aria-label="価格の確認日" required className={input} />
    </div>
  );
}

function Requests({ data }: { data: AdminData }) {
  if (data.requests.length === 0) return <Empty icon="inbox">申請はまだありません。</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className={`${table} min-w-[720px]`}>
        <thead>
          <tr>
            <th className={head}>申請</th>
            <th className={head}>内容</th>
            <th className={head}>対応</th>
          </tr>
        </thead>
        <tbody>
          {data.requests.map((r) => (
            <tr key={r.id}>
              <td className={cell}>
                <p className="font-headline-sm text-headline-sm text-on-surface">{r.name}</p>
                <p className={sub}>
                  {new Date(r.createdAt).toLocaleString("ja-JP")}・@{r.handle ?? "退会済み"}
                </p>
              </td>
              <td className={cell}>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className={`break-all ${link}`}>
                    {r.url}
                  </a>
                )}
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {data.categories.find((c) => c.id === r.categoryId)?.name}
                  {r.planName && `・${r.planName}`}
                  {r.price !== null && `・${r.currency === "USD" ? "$" : "¥"}${r.price}`}
                </p>
                {r.comment && <p className="mt-1 rounded-lg bg-surface-container-low px-2.5 py-1.5 font-body-sm text-body-sm text-on-surface-variant">{r.comment}</p>}
              </td>
              <td className={cell}>
                {r.status === "open" ? (
                  <div className="space-y-2">
                    <ActionForm action={approveRequest} className="space-y-1.5" submitLabel="承認してマスタに追加">
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="url" value={r.url ?? ""} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input name="slug" placeholder="slug" aria-label="slug" required className={input} />
                        <input name="name" defaultValue={r.name} aria-label="サービス名" required className={input} />
                        <input name="company" placeholder="運営会社" aria-label="運営会社" className={input} />
                        <select name="categoryId" defaultValue={r.categoryId ?? undefined} aria-label="カテゴリ" className={input}>
                          {data.categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </ActionForm>
                    <ActionButton action={rejectRequest.bind(null, r.id)} label="却下" tone="danger" confirmText="この申請を却下しますか？" />
                  </div>
                ) : r.status === "approved" ? (
                  <Badge className="bg-primary-fixed text-on-primary-fixed-variant">承認済み</Badge>
                ) : (
                  <Badge className="bg-surface-container text-outline">却下</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Affiliate({ data }: { data: AdminData }) {
  return (
    <div className="overflow-x-auto">
      <table className={`${table} min-w-[640px]`}>
        <thead>
          <tr>
            <th className={head}>サービス</th>
            <th className={head}>リンク</th>
            <th className={head}>有効</th>
            <th className={`${head} text-right`}>クリック（30日）</th>
            <th className={`${head} text-right`}>クリック（90日）</th>
          </tr>
        </thead>
        <tbody>
          {[...data.services]
            .sort((a, b) => (data.clicks.get(b.id)?.d30 ?? 0) - (data.clicks.get(a.id)?.d30 ?? 0))
            .map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low/50">
                <td className={`${cell} font-bold`}>{s.name}</td>
                <td className={`${cell} max-w-64 truncate font-label-sm text-label-sm text-on-surface-variant`}>{s.affiliateUrl ?? "—"}</td>
                <td className={cell}>
                  {s.affiliateActive && s.affiliateUrl ? <Badge className="bg-primary-fixed text-on-primary-fixed-variant">有効</Badge> : <span className="text-outline">—</span>}
                </td>
                <td className={`${cell} num text-right font-price-md text-price-md`}>{data.clicks.get(s.id)?.d30 ?? 0}</td>
                <td className={`${cell} num text-right font-price-md text-price-md text-on-surface-variant`}>{data.clicks.get(s.id)?.d90 ?? 0}</td>
              </tr>
            ))}
        </tbody>
        <caption className={`caption-bottom px-3 py-2.5 text-left ${sub}`}>リンクの編集はサービスマスタのタブで行います。</caption>
      </table>
    </div>
  );
}

async function Reports({ data }: { data: AdminData }) {
  if (data.reports.length === 0) return <Empty icon="flag">通報はまだありません。</Empty>;
  const idx = await getIndex();
  const handleOf = (type: string, id: string) => {
    const userId = type === "comment" ? idx.ds.subscriptions.find((s) => s.id === id)?.userId : id;
    return data.users.find((u) => u.id === userId)?.handle ?? null;
  };
  return (
    <div className="overflow-x-auto">
      <table className={`${table} min-w-[720px]`}>
        <thead>
          <tr>
            <th className={head}>日時</th>
            <th className={head}>対象</th>
            <th className={head}>理由</th>
            <th className={head}>対応</th>
          </tr>
        </thead>
        <tbody>
          {[...data.reports]
            .sort((a, b) => Number(b.status === "open") - Number(a.status === "open"))
            .map((r) => {
              const handle = handleOf(r.targetType, r.targetId);
              return (
                <tr key={r.id} className={r.status === "open" ? "" : "text-outline"}>
                  <td className={cell}>
                    <span className="num">{new Date(r.createdAt).toLocaleString("ja-JP")}</span>
                    <p className={sub}>通報者 @{r.reporter ?? "退会済み"}</p>
                  </td>
                  <td className={cell}>
                    {r.targetType === "comment" ? "コメント" : "構成"}：
                    {handle ? (
                      <Link href={`/@${handle}`} className={link}>
                        @{handle}
                      </Link>
                    ) : (
                      <span className={sub}>{r.targetId}（非表示か削除済み）</span>
                    )}
                  </td>
                  <td className={cell}>
                    {REPORT_REASONS.find((x) => x.id === r.reason)?.label ?? r.reason}
                    {r.detail && <p className="font-label-sm text-label-sm font-normal text-on-surface-variant">{r.detail}</p>}
                  </td>
                  <td className={cell}>
                    {r.status === "open" ? (
                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton action={handleReport.bind(null, r.id, "hide")} label="非表示にする" tone="danger" confirmText="対象を非表示にしますか？" />
                        <ActionButton action={handleReport.bind(null, r.id, "resolve")} label="対応済み" />
                        <ActionButton action={handleReport.bind(null, r.id, "dismiss")} label="対応不要" />
                      </div>
                    ) : (
                      <Badge className="bg-surface-container text-outline">{r.status === "resolved" ? "対応済み" : "対応不要"}</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

function Users({ data, selfId }: { data: AdminData; selfId: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={`${table} min-w-[640px]`}>
        <thead>
          <tr>
            <th className={head}>ユーザー</th>
            <th className={head}>公開範囲</th>
            <th className={head}>登録日</th>
            <th className={head}>状態</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id} className="hover:bg-surface-container-low/50">
              <td className={cell}>
                <Link href={`/@${u.handle}`} className="font-bold text-on-surface hover:text-primary">
                  {u.displayName}
                </Link>
                <span className={`ml-1 ${sub}`}>@{u.handle}</span>
                {u.role === "admin" && <Badge className="ml-1.5 bg-primary-fixed text-on-primary-fixed-variant">管理者</Badge>}
              </td>
              <td className={`${cell} text-on-surface-variant`}>{{ public: "公開", unlisted: "限定公開", private: "非公開" }[u.visibility]}</td>
              <td className={`${cell} num text-on-surface-variant`}>{new Date(u.createdAt).toLocaleDateString("ja-JP")}</td>
              <td className={cell}>
                <div className="flex flex-wrap items-center gap-2">
                  {u.status === "suspended" ? (
                    <Badge className="bg-error-container text-on-error-container">停止中</Badge>
                  ) : (
                    <Badge className="bg-surface-container text-on-surface-variant">利用中</Badge>
                  )}
                  {u.id !== selfId &&
                    (u.status === "active" ? (
                      <ActionButton action={setUserStatus.bind(null, u.id, "suspended")} label="停止する" tone="danger" confirmText={`@${u.handle} を利用停止にしますか？`} />
                    ) : (
                      <ActionButton action={setUserStatus.bind(null, u.id, "active")} label="停止を解除" />
                    ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
