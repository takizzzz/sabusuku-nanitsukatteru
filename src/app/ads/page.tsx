import { Article, LegalPage } from "@/components/legal";

export const metadata = { title: "広告・アフィリエイトについて" };

export default function Page() {
  return (
    <LegalPage
      current="/ads"
      title="広告・アフィリエイトについて"
      intro={
        <p>
          当サイトは、運営費をまかなうためにアフィリエイトプログラムと広告を利用しています。
          アフィリエイトリンクと広告には「PR」または「広告」と表示します。
        </p>
      }
    >
      <Article n={1} title="ランキングと統計の方針">
        <p>
          ランキングや統計の順位は、会員が登録したデータだけで決めています。アフィリエイトの有無や報酬額によって順位や表示を変えることはありません。
        </p>
      </Article>
      <Article n={2} title="口コミの扱い">
        <p>会員が書いたコメントを、運営側の宣伝のために書き換えたり転用したりすることはありません。</p>
      </Article>
      <Article n={3} title="価格について">
        <p>
          構成ページの月額は会員本人の申告値です。プランの参考価格は表示している時点のもので、最新の価格は各公式サイトでご確認ください。
        </p>
      </Article>
    </LegalPage>
  );
}
