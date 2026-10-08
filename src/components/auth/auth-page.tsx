import { CalendarClock, ChartPie, LayoutList, Link2, Sparkles } from "lucide-react";
import { DemoNotice } from "@/components/demo-notice";
import { safeNextPath, SITE_NAME } from "@/lib/format";
import { supabaseConfigured } from "@/lib/supabase/server";
import { AuthForm } from "./auth-form";

const benefits = [
  { icon: LayoutList, title: "マイ構成ページ", body: "使っているサブスクを一覧で公開" },
  { icon: ChartPie, title: "月額を自動で合計", body: "年額プランも月割りで計算" },
  { icon: Link2, title: "限定公開リンク", body: "URLを知っている人だけに見せる" },
  { icon: CalendarClock, title: "解約の記録", body: "やめた理由と乗り換え先も残せる" },
];

const ERRORS: Record<string, string> = {
  callback: "ログインを完了できませんでした。もう一度お試しください。",
  suspended: "このアカウントは利用停止中です。",
};

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
    <div className="mx-auto max-w-md space-y-8 px-4 py-8 md:py-12">
      <header className="space-y-3 text-center">
        <p className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">
          <Sparkles className="size-3.5" aria-hidden />
          みんなのサブスク、みせあいっこ
        </p>
        <h1 className="text-2xl leading-snug font-extrabold md:text-3xl">
          {reset ? "パスワードの再設定" : <>「{SITE_NAME}」<br />へようこそ！</>}
        </h1>
        {!reset && <p className="text-sm text-muted">ほかの人の使い分けを参考に、自分のサブスク構成を登録しよう。</p>}
      </header>

      {!supabaseConfigured && <DemoNotice>ログイン機能は Supabase の接続後に使えるようになります。いまは画面の確認だけできます。</DemoNotice>}

      <AuthForm mode={reset ? "reset" : mode} next={next} notice={notice} />

      {mode === "signup" && (
        <section className="rounded-2xl bg-surface-2 p-5" aria-labelledby="benefits">
          <h2 id="benefits" className="mb-3 text-base font-extrabold">登録するとできること</h2>
          <ul className="grid grid-cols-2 gap-3">
            {benefits.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-xl bg-card p-3">
                <Icon className="size-5 text-accent" aria-hidden />
                <p className="mt-1 text-sm font-bold">{title}</p>
                <p className="text-xs text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
