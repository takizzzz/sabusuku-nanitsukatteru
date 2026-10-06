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
| S-03 | 構成詳細 `/@handle`（OGP画像つき） | ✓（いいね・通報はログイン実装後） |
| S-07 | ランキング `/ranking` | ✓（急上昇・前回比は履歴データができてから） |
| S-04, S-05, S-08〜S-13, S-16 | | 準備中 |
| S-14 | `/ads` | ✓（規約・プライバシーは準備中） |
