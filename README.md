# さぶすくなにつかってる！？

みんなの契約中サブスクと「どう使い分けているか」を公開・共有する Web サービス。

- Next.js（App Router）＋ Tailwind CSS v4
- Supabase（Postgres・Auth）、Vercel にデプロイする想定

## 開発

```bash
npm install
npm run dev
```

`.env.local` に Supabase の値がなければ、`src/data/seed.ts` のダミーデータで全画面が見られる。

## 構成

| パス | 内容 |
|---|---|
| `supabase/migrations/` | DB スキーマと RLS（要件定義書 7章） |
| `src/lib/stacks.ts` | 月額合計・統計・検索・ランキングの集計（純粋関数） |
| `src/lib/data.ts` | データの読み込み（Supabase かダミーデータ） |
| `src/data/seed.ts` | ダミーデータ（価格は仮） |
| `src/app/` | 画面。構成ページの公開 URL は `/@handle`（内部は `/u/[handle]`） |

## 画面の実装状況

| ID | 画面 | 状況 |
|---|---|---|
| S-01 | トップ `/` | ✓ |
| S-02 | 構成を探す `/stacks` | ✓ |
| S-03 | 構成詳細 `/@handle`（OGP画像つき） | ✓ いいね・通報・本人の「編集する」 |
| S-04 | サービス一覧 `/services` | ✓ |
| S-05 | サービス詳細 `/services/[slug]` | ✓ |
| S-06 | 併用比較 `/compare/{a}-{b}`（入口 `/compare`） | ✓ |
| S-07 | ランキング `/ranking` | ✓（急上昇・前回比は履歴データができてから） |
| S-08 | 会員登録・ログイン `/signup` `/login` | ✓ メール・Google・X、パスワード再設定 |
| S-09 | オンボーディング `/welcome` | ✓ 3ステップ＋完了画面（下書きは端末に保存） |
| S-10 | マイ構成 `/me` | ✓ 公開範囲、並び替え、非公開、解約・再契約 |
| S-11 | サブスク追加・編集 | ✓（S-10 のダイアログ） |
| S-12 | サービス追加申請 `/services/request` | ✓ |
| S-13 | 設定 `/settings` | ✓ プロフィール、公開範囲、パスワード、退会 |
| S-14 | `/terms` `/privacy` `/about` `/ads` | ✓（規約類は草案。運営者名・連絡先・管轄裁判所は `src/lib/site-info.ts` に記入） |
| S-15 | 通報 `/report` | ✓ |
| S-16 | 管理画面 `/admin` | ✓ サービス・プラン、申請承認、クリック数、通報対応、利用停止 |

Supabase 未接続のあいだは、ログインが必要な画面もダミーユーザー（@kenji_dev）のデモ表示になり、保存はできない。

## Supabase の準備

1. プロジェクトを作り、`supabase/migrations/` の SQL を番号順に実行する
2. `.env.local`（Vercel では環境変数）に URL・anon key・service role key・サイトURLを入れる
3. Authentication → URL Configuration の Redirect URLs に `<サイトURL>/auth/callback` を足す
4. Google と X（OAuth 2.0）のプロバイダを有効にする
5. 管理者にする人は `profiles.role` を SQL で `admin` にする
