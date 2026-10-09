import { DemoNotice } from "@/components/demo-notice";
import { safeNextPath, SITE_NAME } from "@/lib/format";
import { supabaseConfigured } from "@/lib/supabase/server";
import { AuthForm } from "./auth-form";

const benefits = [
  { icon: "dashboard_customize", color: "text-primary", title: "マイ構成ページ", body: "使っているサブスクを一覧で公開" },
  { icon: "query_stats", color: "text-secondary", title: "月額を自動で合計", body: "年額プランも月割りで計算" },
  { icon: "link", color: "text-tertiary", title: "限定公開リンク", body: "URLを知っている人だけに見せる" },
  { icon: "history", color: "text-primary-container", title: "解約の記録", body: "やめた理由と乗り換え先も残せる" },
];

const ERRORS: Record<string, string> = {
  callback: "ログインを完了できませんでした。もう一度お試しください。",
  suspended: "このアカウントは利用停止中です。",
};

/** S-08 ログイン・新規登録 */
export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: "signup" | "login";
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const reset = mode === "login" && sp.reset === "1";
  const notice = typeof sp.error === "string" ? ERRORS[sp.error] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-margin-mobile pb-space-xl">
      <header className="pt-space-md pb-space-sm text-center">
        <p className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-surface-container px-3 py-1 text-primary shadow-sm">
          <span className="material-symbols-outlined fill text-[16px]" aria-hidden>
            auto_awesome
          </span>
          <span className="font-label-sm text-label-sm font-bold">みんなのサブスク、みせあいっこ</span>
        </p>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
          {reset ? (
            "パスワードの再設定"
          ) : (
            <>
              「{SITE_NAME}」
              <br />
              へようこそ！
            </>
          )}
        </h1>
        {!reset && (
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            ほかの人の使い分けを参考に、
            <br />
            自分のサブスク構成を登録しよう。
          </p>
        )}
      </header>

      {!supabaseConfigured && (
        <div className="mt-space-md">
          <DemoNotice>ログイン機能は Supabase の接続後に使えるようになります。いまは画面の確認だけできます。</DemoNotice>
        </div>
      )}

      <AuthForm mode={reset ? "reset" : mode} next={next} notice={notice} />

      {mode === "signup" && (
        <section
          className="relative mt-space-lg w-full overflow-hidden rounded-xl bg-surface-container p-space-md shadow-sm"
          aria-labelledby="benefits"
        >
          <div className="pointer-events-none absolute -right-8 -bottom-8 size-28 rounded-full bg-primary/10 blur-xl" aria-hidden />
          <div className="mb-space-xs flex items-center gap-1.5 text-primary">
            <span className="material-symbols-outlined fill text-[18px]" aria-hidden>
              stars
            </span>
            <h2 id="benefits" className="font-headline-sm text-headline-sm font-bold text-on-surface">
              登録するとできること
            </h2>
          </div>
          <ul className="mt-space-xs grid grid-cols-2 gap-space-sm">
            {benefits.map((b) => (
              <li key={b.title} className="flex items-start gap-2 rounded-lg bg-surface-container-lowest/80 p-2.5">
                <span className={`material-symbols-outlined mt-0.5 shrink-0 text-[18px] ${b.color}`} aria-hidden>
                  {b.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md font-bold text-on-surface">{b.title}</p>
                  <p className="font-body-sm text-[11px] leading-tight text-on-surface-variant">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
