import { Article, LegalPage, Placeholder } from "@/components/legal";
import { SITE_NAME } from "@/lib/format";
import { OPERATOR } from "@/lib/site-info";

export const metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      title="プライバシーポリシー"
      intro={<p>「{SITE_NAME}」（以下「本サービス」）で取得する情報と、その使い方を説明します。</p>}
    >
      <Article n={1} title="取得する情報">
        <ul>
          <li>登録時の情報：メールアドレス、Google・X でログインした場合はそのアカウントの識別子と表示名</li>
          <li>プロフィール：表示名、ユーザーID、アイコン、職種、年代、用途タグ、自己紹介</li>
          <li>構成の情報：契約中・解約済みのサブスク、プラン、月額、満足度、コメント、利用開始・解約の年月、解約理由</li>
          <li>利用状況：いいね、通報、サービス追加の申請、公式サイトへのリンクのクリック、アクセスログ、Cookie</li>
        </ul>
      </Article>
      <Article n={2} title="使う目的">
        <ul>
          <li>本サービスの提供（ログイン、構成ページの表示、共有画像の作成など）</li>
          <li>ランキングや平均月額などの統計の作成</li>
          <li>不正利用の防止、通報への対応、お問い合わせへの返信</li>
          <li>アフィリエイトの成果の確認と、本サービスの改善</li>
        </ul>
      </Article>
      <Article n={3} title="公開される情報">
        <p>構成を「公開」または「リンクを知っている人のみ」にした場合、プロフィール（メールアドレスを除く）と構成の情報は、その範囲で誰でも見られます。サブスクごとに非公開にすることもできます。</p>
      </Article>
      <Article n={4} title="第三者への提供">
        <p>次の場合を除き、本人の同意なく個人情報を第三者に提供しません。</p>
        <ul>
          <li>法令に基づく場合</li>
          <li>個人を特定できない形に集計した統計データとして提供する場合</li>
        </ul>
      </Article>
      <Article n={5} title="外部サービスの利用">
        <p>本サービスは次の外部サービスを使っており、必要な範囲で情報がそれぞれに送られます。</p>
        <ul>
          <li>Supabase（会員情報と投稿の保存、ログイン）</li>
          <li>Vercel（サイトの配信）</li>
          <li>Google・X（ソーシャルログインを選んだ場合）</li>
          <li>アフィリエイトサービス・広告配信事業者（リンクを経由した場合や広告を表示した場合）</li>
        </ul>
      </Article>
      <Article n={6} title="Cookie">
        <p>ログイン状態の維持のために Cookie を使います。ブラウザの設定で Cookie を無効にすると、ログインできなくなります。</p>
      </Article>
      <Article n={7} title="開示・訂正・削除">
        <p>プロフィールと構成は、本人が設定画面とマイ構成からいつでも変更・削除できます。退会すると登録データを削除します。そのほかの開示などのご依頼は、運営者までご連絡ください。</p>
      </Article>
      <Article n={8} title="改定">
        <p>このポリシーを変更するときは、本サービス上でお知らせします。</p>
      </Article>
      <Article n={9} title="お問い合わせ先">
        <p>
          運営者：{OPERATOR.name ?? <Placeholder />}
          <br />
          連絡先：{OPERATOR.contact ?? <Placeholder />}
        </p>
      </Article>
    </LegalPage>
  );
}
