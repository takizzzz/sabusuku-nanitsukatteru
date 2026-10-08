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
        <dl className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-2 font-body-sm text-body-sm">
          <div className="flex items-center justify-between gap-space-sm py-1">
            <dt className="text-on-surface-variant">サービス名</dt>
            <dd className="font-bold text-on-surface text-right">{SITE_NAME}</dd>
          </div>
          <div className="flex items-center justify-between gap-space-sm py-1">
            <dt className="text-on-surface-variant">運営者</dt>
            <dd className="font-bold text-on-surface text-right">{OPERATOR.name ?? <Placeholder />}</dd>
          </div>
          <div className="flex items-center justify-between gap-space-sm py-1">
            <dt className="text-on-surface-variant">連絡先</dt>
            <dd className="font-bold text-on-surface text-right break-all">{OPERATOR.contact ?? <Placeholder />}</dd>
          </div>
        </dl>
      </Article>
    </LegalPage>
  );
}
