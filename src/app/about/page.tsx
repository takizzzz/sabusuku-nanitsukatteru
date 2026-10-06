import { Article, LegalPage, Placeholder } from "@/components/legal";
import { SITE_NAME } from "@/lib/format";
import { OPERATOR } from "@/lib/site-info";

export const metadata = { title: "運営者情報" };

export default function AboutPage() {
  return (
    <LegalPage current="/about" title="運営者情報">
      <Article title={`${SITE_NAME} について`}>
        <p>
          AIをはじめ、サブスクが増えて「どれを契約して、どう使い分ければいいか」が分かりにくくなりました。本サービスは、会員が実際に契約しているサブスクと使い分けを持ち寄り、ほかの人の構成を参考にできる場所です。
        </p>
        <p>現在はベータ版です。機能や表示は予告なく変わることがあります。</p>
      </Article>
      <Article title="運営者">
        <dl className="grid grid-cols-[6rem_1fr] gap-y-2">
          <dt className="font-bold text-fg">運営者</dt>
          <dd>{OPERATOR.name ?? <Placeholder />}</dd>
          <dt className="font-bold text-fg">連絡先</dt>
          <dd>{OPERATOR.contact ?? <Placeholder />}</dd>
        </dl>
      </Article>
    </LegalPage>
  );
}
