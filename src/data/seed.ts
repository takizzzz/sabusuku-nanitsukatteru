// 開発・プレビュー用のダミーデータ。Supabase 未設定時はこれを表示する。
// 価格はすべて仮の値（実データはサービスマスタ管理で月次更新する）。

import type {
  Category,
  Dataset,
  Like,
  Plan,
  Profile,
  Service,
  UserSubscription,
} from "@/lib/types";
import catalog from "../../supabase/seed/catalog.json";

const PRICE_CHECKED_AT = "2026-10-01";

export const categories: Category[] = catalog.categories.map((c, i) => ({
  id: i + 1,
  slug: c.slug,
  name: c.name,
  sortOrder: i + 1,
}));

type ServiceSeed = [
  slug: string,
  name: string,
  company: string,
  category: string,
  color: string,
  url: string,
  plans: [name: string, price: number, cycle?: "yearly"][],
  affiliate?: boolean,
];

const serviceSeeds: ServiceSeed[] = [
  ["chatgpt", "ChatGPT", "OpenAI", "ai", "#10a37f", "https://chatgpt.com/", [["Plus", 3000], ["Pro", 30000]]],
  ["claude", "Claude", "Anthropic", "ai", "#d97757", "https://claude.ai/", [["Pro", 3000], ["Max", 15000]]],
  ["gemini", "Google AI Pro", "Google", "ai", "#4285f4", "https://gemini.google.com/", [["AI Pro", 2900]]],
  ["perplexity", "Perplexity", "Perplexity AI", "ai", "#20808d", "https://www.perplexity.ai/", [["Pro", 3000]]],
  ["cursor", "Cursor", "Anysphere", "ai", "#111111", "https://cursor.com/", [["Pro", 3000], ["Business", 6000]]],
  ["github-copilot", "GitHub Copilot", "GitHub", "ai", "#24292f", "https://github.com/features/copilot", [["Pro", 1500], ["Pro (年払い)", 15000, "yearly"]]],
  ["midjourney", "Midjourney", "Midjourney", "ai", "#000000", "https://www.midjourney.com/", [["Basic", 1500], ["Standard", 4500]]],
  ["v0", "v0", "Vercel", "ai", "#000000", "https://v0.app/", [["Premium", 3000]]],
  ["elevenlabs", "ElevenLabs", "ElevenLabs", "ai", "#000000", "https://elevenlabs.io/", [["Creator", 3300]]],
  ["notion", "Notion", "Notion Labs", "work", "#000000", "https://www.notion.com/", [["Plus", 1650], ["Business (AI込み)", 3800]]],
  ["figma", "Figma", "Figma", "work", "#a259ff", "https://www.figma.com/", [["Professional", 2400]]],
  ["canva", "Canva", "Canva", "work", "#00c4cc", "https://www.canva.com/", [["Pro", 1180]], true],
  ["adobe-cc", "Adobe Creative Cloud", "Adobe", "work", "#da1f26", "https://www.adobe.com/creativecloud.html", [["コンプリート", 7780], ["フォト", 2380]], true],
  ["deepl", "DeepL", "DeepL", "work", "#0f2b46", "https://www.deepl.com/", [["Starter", 1200]]],
  ["linear", "Linear", "Linear", "work", "#5e6ad2", "https://linear.app/", [["Basic", 1500]]],
  ["dropbox", "Dropbox", "Dropbox", "work", "#0061fe", "https://www.dropbox.com/", [["Plus", 1500]], true],
  ["netflix", "Netflix", "Netflix", "video", "#e50914", "https://www.netflix.com/", [["スタンダード", 1590], ["プレミアム", 2290]]],
  ["youtube-premium", "YouTube Premium", "Google", "video", "#ff0000", "https://www.youtube.com/premium", [["個人", 1280]]],
  ["amazon-prime", "Amazon プライム", "Amazon", "video", "#00a8e1", "https://www.amazon.co.jp/prime", [["月額", 600]], true],
  ["disney-plus", "Disney+", "Disney", "video", "#113ccf", "https://www.disneyplus.com/", [["スタンダード", 1140]], true],
  ["u-next", "U-NEXT", "U-NEXT", "video", "#000000", "https://video.unext.jp/", [["月額", 2189]], true],
  ["spotify", "Spotify", "Spotify", "music", "#1db954", "https://www.spotify.com/", [["Premium Standard", 1080]]],
  ["apple-music", "Apple Music", "Apple", "music", "#fa243c", "https://www.apple.com/apple-music/", [["個人", 1080]]],
  ["kindle-unlimited", "Kindle Unlimited", "Amazon", "learning", "#ff9900", "https://www.amazon.co.jp/kindle-dbs/hz/subscribe/ku", [["月額", 980]], true],
  ["duolingo", "Duolingo", "Duolingo", "learning", "#58cc02", "https://www.duolingo.com/", [["Super", 1500]]],
  ["udemy", "Udemy", "Udemy", "learning", "#a435f0", "https://www.udemy.com/", [["Personal Plan", 2500]], true],
  ["google-one", "Google One", "Google", "other", "#4285f4", "https://one.google.com/", [["100GB", 250]]],
  ["icloud", "iCloud+", "Apple", "other", "#3693f3", "https://www.apple.com/icloud/", [["200GB", 450]]],
];

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const catalogBySlug = new Map(catalog.services.map((s) => [s.slug, s]));
const seededSlugs = new Set(serviceSeeds.map(([slug]) => slug));

// 構成で使う上の28件はプラン番号を固定したいのでそのまま。残りは本番と同じサービスマスタから足す
const extraServices = catalog.services.filter((s) => !seededSlugs.has(s.slug));

export const services: Service[] = [
  ...serviceSeeds.map(([slug, name, company, category, color, url, , affiliate]) => ({
    id: `svc-${slug}`,
    slug,
    name,
    company,
    categoryId: categoryBySlug.get(catalogBySlug.get(slug)?.category ?? category)!.id,
    logoUrl: null,
    brandColor: color,
    officialUrl: url,
    affiliateUrl: affiliate ? `${url}?ref=placeholder` : null,
    affiliateActive: Boolean(affiliate),
  })),
  ...extraServices.map((s) => ({
    id: `svc-${s.slug}`,
    slug: s.slug,
    name: s.name,
    company: s.company,
    categoryId: categoryBySlug.get(s.category)!.id,
    logoUrl: null,
    brandColor: s.brand_color,
    officialUrl: s.official_url,
    affiliateUrl: null,
    affiliateActive: false,
  })),
];

export const plans: Plan[] = [
  ...serviceSeeds.flatMap(([slug, , , , , , planSeeds]) =>
    planSeeds.map(([name, price, cycle], i) => ({
      id: `plan-${slug}-${i}`,
      serviceId: `svc-${slug}`,
      name,
      price,
      billingCycle: (cycle ?? "monthly") as Plan["billingCycle"],
      priceCheckedAt: PRICE_CHECKED_AT,
    })),
  ),
  ...extraServices.flatMap((s) =>
    s.plans.map((p, i) => ({
      id: `plan-${s.slug}-${i}`,
      serviceId: `svc-${s.slug}`,
      name: p.name,
      price: p.price_jpy,
      billingCycle: p.billing_cycle as Plan["billingCycle"],
      priceCheckedAt: s.checked_on,
    })),
  ),
];

// ---------------------------------------------------------------
// 構成（ユーザーと契約）
// ---------------------------------------------------------------

type ActiveSeed = {
  s: string; // service slug
  p?: number; // plan index
  sat: number;
  c: string;
  t: string[];
  from: string;
};
type CancelledSeed = {
  s: string;
  p?: number;
  on: string;
  reason: string;
  detail: string;
  to?: string;
};

type StackSeed = {
  handle: string;
  name: string;
  occupation: string;
  age: string;
  bio: string;
  tags: string[];
  updated: string;
  visibility?: Profile["visibility"];
  active: ActiveSeed[];
  cancelled?: CancelledSeed[];
};

const stackSeeds: StackSeed[] = [
  {
    handle: "kenji_dev",
    name: "kenji",
    occupation: "Webエンジニア",
    age: "30代前半",
    bio: "SaaS企業でフルスタック開発。生成AIをフル活用して開発効率3倍を目指しています。",
    tags: ["コーディング", "リサーチ", "資料作成"],
    updated: "2026-10-04",
    active: [
      { s: "cursor", sat: 5, c: "インライン補完とエージェントが神。日常のコーディングの7割はCursor任せ。", t: ["コーディング"], from: "2024-01" },
      { s: "claude", sat: 5, c: "Projectsに設計書とAPI仕様を読ませて壁打ち。深い思考と日本語の自然さはダントツ。", t: ["リサーチ", "資料作成"], from: "2024-03" },
      { s: "chatgpt", sat: 4, c: "スマホでの音声会話とWeb検索用。Claude一本化するか検討中。", t: ["リサーチ", "音声会話"], from: "2023-02" },
      { s: "github-copilot", sat: 4, c: "PRの要約生成とCLI補完用。エディタ内はCursorに移行したがGitHub連携のため継続。", t: ["コーディング"], from: "2023-06" },
      { s: "spotify", sat: 5, c: "作業用BGM。集中プレイリストを流しっぱなし。", t: ["音楽"], from: "2019-04" },
    ],
    cancelled: [
      { s: "notion", on: "2026-08", reason: "他サービスで代替できた", detail: "ドキュメントの要約や検索がClaudeのProjectsで完結するようになったため。", to: "claude" },
    ],
  },
  {
    handle: "yuka_design",
    name: "ゆか",
    occupation: "UI/UXデザイナー",
    age: "20代後半",
    bio: "事業会社のプロダクトデザイナー。画像生成とプロトタイピングを日常的に使っています。",
    tags: ["デザイン", "画像生成"],
    updated: "2026-10-05",
    active: [
      { s: "figma", sat: 5, c: "仕事の中心。プロトタイプからハンドオフまで全部これ。", t: ["デザイン"], from: "2020-05" },
      { s: "midjourney", p: 1, sat: 4, c: "キービジュアルの案出し用。Standardにして生成枠の心配がなくなった。", t: ["画像生成"], from: "2023-09" },
      { s: "chatgpt", sat: 4, c: "要件整理とUIコピーのたたき台づくり。", t: ["文章作成"], from: "2023-05" },
      { s: "notion", sat: 3, c: "議事録とデザインレビューの記録用。", t: ["議事録"], from: "2022-01" },
      { s: "netflix", sat: 4, c: "週末に。UIの参考にもなる。", t: ["動画視聴"], from: "2018-03" },
    ],
  },
  {
    handle: "ryo_pm",
    name: "りょう",
    occupation: "プロダクトマネージャー",
    age: "30代後半",
    bio: "メディア系のPdM。競合リサーチと仕様書作成に生成AIを使い分け中。",
    tags: ["リサーチ", "資料作成"],
    updated: "2026-10-01",
    active: [
      { s: "claude", sat: 5, c: "PRDのレビューと長文の要約はClaudeが一番安定している。", t: ["資料作成", "要約"], from: "2024-06" },
      { s: "perplexity", sat: 4, c: "競合調査の一次情報探し。出典が付くので社内共有しやすい。", t: ["リサーチ"], from: "2024-02" },
      { s: "notion", p: 1, sat: 4, c: "チームのドキュメント置き場。AI込みのBusinessプラン。", t: ["議事録", "資料作成"], from: "2021-10" },
      { s: "linear", sat: 5, c: "課題管理。速くて開発チームの評判もいい。", t: ["タスク管理"], from: "2023-04" },
    ],
    cancelled: [
      { s: "chatgpt", on: "2026-05", reason: "他サービスで代替できた", detail: "ClaudeとPerplexityで用途が埋まったので解約。", to: "claude" },
    ],
  },
  {
    handle: "haruka_pm",
    name: "はるか",
    occupation: "プロダクトマネージャー",
    age: "20代後半",
    bio: "BtoB SaaSのPM。仕様書とユーザーインタビューの整理が主な用途。",
    tags: ["要約", "資料作成"],
    updated: "2026-10-05",
    active: [
      { s: "chatgpt", sat: 4, c: "インタビューの文字起こしを要約。カスタムGPTでPRDの壁打ちも。", t: ["要約", "資料作成"], from: "2023-08" },
      { s: "notion", sat: 5, c: "仕様書のドラフトはNotion AIで一瞬。", t: ["資料作成"], from: "2022-04" },
      { s: "figma", sat: 4, c: "ワイヤーを自分で描く用。", t: ["デザイン"], from: "2023-01" },
      { s: "youtube-premium", sat: 5, c: "広告なしで勉強動画を見られるのが大きい。", t: ["動画視聴", "学習"], from: "2021-07" },
    ],
  },
  {
    handle: "takuya_design",
    name: "たくや",
    occupation: "UI/UXデザイナー",
    age: "30代前半",
    bio: "フリーランスのデザイナー。案件ごとにツールを入れ替えています。",
    tags: ["デザイン", "画像生成"],
    updated: "2026-10-03",
    active: [
      { s: "adobe-cc", sat: 4, c: "Photoshopとillustratorは納品で必須。", t: ["デザイン"], from: "2015-04" },
      { s: "figma", sat: 5, c: "UIはすべてFigma。", t: ["デザイン"], from: "2019-02" },
      { s: "midjourney", sat: 4, c: "ムードボード作成用。Basicで足りている。", t: ["画像生成"], from: "2023-03" },
      { s: "chatgpt", sat: 3, c: "提案書の文章チェック。", t: ["文章作成"], from: "2023-04" },
    ],
    cancelled: [
      { s: "canva", on: "2025-12", reason: "使う頻度が減った", detail: "SNS用の画像もFigmaで作るようになった。" , to: "figma" },
    ],
  },
  {
    handle: "editor_shun",
    name: "しゅん",
    occupation: "ライター・編集",
    age: "40代",
    bio: "IT系メディアの編集者。海外記事の一次情報を読むことが多いです。",
    tags: ["文章作成", "翻訳"],
    updated: "2026-10-01",
    active: [
      { s: "claude", sat: 5, c: "日本語のニュアンスが自然。構成案と推敲に使う。", t: ["文章作成"], from: "2024-04" },
      { s: "deepl", sat: 4, c: "海外ソースの翻訳。用語集機能が便利。", t: ["翻訳"], from: "2021-09" },
      { s: "notion", sat: 4, c: "取材メモと原稿管理。", t: ["議事録"], from: "2020-11" },
      { s: "kindle-unlimited", sat: 3, c: "資料用の本を拾い読み。", t: ["学習"], from: "2022-06" },
    ],
  },
  {
    handle: "daiki_ts",
    name: "だいき",
    occupation: "Webエンジニア",
    age: "20代後半",
    bio: "TypeScriptのフロントエンドエンジニア。個人開発もしています。",
    tags: ["コーディング"],
    updated: "2026-10-05",
    active: [
      { s: "cursor", sat: 5, c: "型定義とテスト作成が爆速。これだけで元が取れる。", t: ["コーディング"], from: "2024-05" },
      { s: "github-copilot", p: 1, sat: 4, c: "年払いで安く。CLIでの補完に使う。", t: ["コーディング"], from: "2022-08" },
      { s: "v0", sat: 4, c: "UIの初期モックを最速で出す用。", t: ["デザイン", "コーディング"], from: "2025-03" },
      { s: "chatgpt", sat: 3, c: "調べもの。最近は出番が減った。", t: ["リサーチ"], from: "2023-03" },
    ],
  },
  {
    handle: "yuki_lab",
    name: "ゆき",
    occupation: "学生・研究者",
    age: "20代前半",
    bio: "情報系の大学院生。論文サーベイと実験コードに使っています。",
    tags: ["リサーチ", "コーディング"],
    updated: "2026-09-29",
    active: [
      { s: "perplexity", sat: 5, c: "論文サーベイはこれ一択。", t: ["リサーチ"], from: "2024-09" },
      { s: "claude", sat: 4, c: "数式の確認と実験コードのレビュー。", t: ["コーディング", "リサーチ"], from: "2025-01" },
      { s: "google-one", sat: 4, c: "実験データの置き場。", t: ["ストレージ"], from: "2022-04" },
      { s: "spotify", sat: 5, c: "研究室で作業用BGM。学割。", t: ["音楽"], from: "2021-04" },
    ],
    cancelled: [
      { s: "chatgpt", on: "2026-03", reason: "料金が高い", detail: "学生には2つ契約はきつい。Claudeに寄せた。", to: "claude" },
    ],
  },
  {
    handle: "maki_growth",
    name: "まき",
    occupation: "マーケター",
    age: "30代前半",
    bio: "D2Cブランドのグロース担当。広告クリエイティブを量産しています。",
    tags: ["文章作成", "画像生成"],
    updated: "2026-10-02",
    active: [
      { s: "canva", sat: 5, c: "広告バナーの量産。テンプレが豊富。", t: ["デザイン"], from: "2021-05" },
      { s: "chatgpt", sat: 4, c: "広告コピーの案出し。", t: ["文章作成"], from: "2023-03" },
      { s: "gemini", sat: 3, c: "Googleドキュメント連携のために。", t: ["文章作成", "要約"], from: "2025-06" },
      { s: "amazon-prime", sat: 4, c: "仕事の備品も私物もこれ。", t: ["その他"], from: "2017-08" },
      { s: "u-next", sat: 3, c: "雑誌読み放題をトレンド収集に。", t: ["動画視聴"], from: "2024-01" },
    ],
  },
  {
    handle: "ren_startup",
    name: "れん",
    occupation: "Webエンジニア",
    age: "30代後半",
    bio: "スタートアップのCTO。少人数で回すためのツール選びをしています。",
    tags: ["コーディング", "資料作成"],
    updated: "2026-09-30",
    active: [
      { s: "claude", p: 1, sat: 5, c: "Maxプラン。設計とコードレビューを任せている。", t: ["コーディング"], from: "2025-02" },
      { s: "cursor", sat: 5, c: "プロトタイプはCursor＋Claudeで最速。", t: ["コーディング"], from: "2024-03" },
      { s: "notion", sat: 4, c: "仕様とナレッジ蓄積。", t: ["資料作成"], from: "2022-09" },
      { s: "linear", sat: 5, c: "スプリント管理。", t: ["タスク管理"], from: "2023-11" },
    ],
  },
  {
    handle: "mio_video",
    name: "みお",
    occupation: "動画クリエイター",
    age: "20代後半",
    bio: "YouTubeとショート動画の編集。ナレーションもAIで作ることがあります。",
    tags: ["動画編集"],
    updated: "2026-10-05",
    active: [
      { s: "adobe-cc", sat: 4, c: "Premiere ProとAfter Effects。", t: ["動画編集"], from: "2019-06" },
      { s: "elevenlabs", sat: 4, c: "仮ナレーションの作成。", t: ["音声"], from: "2025-04" },
      { s: "dropbox", sat: 4, c: "素材の受け渡し。", t: ["ストレージ"], from: "2020-02" },
      { s: "apple-music", sat: 4, c: "BGMの参考集め。", t: ["音楽"], from: "2020-10" },
    ],
  },
  {
    handle: "sora_student",
    name: "そら",
    occupation: "学生・研究者",
    age: "10代",
    bio: "大学1年生。英語の勉強中。",
    tags: ["学習"],
    updated: "2026-09-28",
    active: [
      { s: "duolingo", sat: 4, c: "毎日のストリークが続いている。", t: ["学習"], from: "2025-04" },
      { s: "spotify", sat: 5, c: "通学中にずっと聴いている。", t: ["音楽"], from: "2024-04" },
      { s: "amazon-prime", sat: 4, c: "学生プランで安い。", t: ["動画視聴"], from: "2025-04" },
    ],
  },
  {
    handle: "aya_family",
    name: "あや",
    occupation: "その他",
    age: "40代",
    bio: "家族で使っている動画サブスクの見直し中。",
    tags: ["動画視聴"],
    updated: "2026-09-25",
    visibility: "unlisted",
    active: [
      { s: "netflix", p: 1, sat: 4, c: "家族4人で。プレミアムにしないと同時視聴が足りない。", t: ["動画視聴"], from: "2017-01" },
      { s: "disney-plus", sat: 4, c: "子どもが見る。", t: ["動画視聴"], from: "2021-08" },
      { s: "amazon-prime", sat: 5, c: "配送のために必須。", t: ["その他"], from: "2015-05" },
      { s: "icloud", sat: 4, c: "家族の写真の共有。", t: ["ストレージ"], from: "2019-09" },
    ],
    cancelled: [
      { s: "u-next", on: "2026-07", reason: "使う頻度が減った", detail: "見たい作品を見終わったので解約。" },
    ],
  },
];

const serviceIdBySlug = new Map(services.map((s) => [s.slug, s.id]));
const planById = new Map(plans.map((p) => [p.id, p]));

function monthlyOf(planId: string): number {
  const plan = planById.get(planId)!;
  return plan.billingCycle === "yearly" ? Math.round(plan.price / 12) : plan.price;
}

export const profiles: Profile[] = stackSeeds.map((s, i) => ({
  id: `user-${s.handle}`,
  handle: s.handle,
  displayName: s.name,
  avatarUrl: null,
  occupation: s.occupation,
  ageRange: s.age,
  bio: s.bio,
  visibility: s.visibility ?? "public",
  isSample: false,
  tags: s.tags,
  createdAt: `2026-0${(i % 9) + 1}-10T00:00:00Z`,
  updatedAt: `${s.updated}T12:00:00Z`,
}));

export const subscriptions: UserSubscription[] = stackSeeds.flatMap((s) => {
  const userId = `user-${s.handle}`;
  const active = s.active.map((a, i): UserSubscription => {
    const planId = `plan-${a.s}-${a.p ?? 0}`;
    return {
      id: `sub-${s.handle}-${a.s}`,
      userId,
      serviceId: serviceIdBySlug.get(a.s)!,
      planId,
      monthlyPrice: monthlyOf(planId),
      satisfaction: a.sat,
      comment: a.c,
      startedOn: a.from,
      status: "active",
      cancelledOn: null,
      cancelReason: null,
      cancelReasonDetail: null,
      switchedToServiceId: null,
      isHidden: false,
      sortOrder: i,
      tags: a.t,
      updatedAt: `${s.updated}T12:00:00Z`,
    };
  });
  const cancelled = (s.cancelled ?? []).map((c, i): UserSubscription => {
    const planId = `plan-${c.s}-${c.p ?? 0}`;
    return {
      id: `sub-${s.handle}-${c.s}-x`,
      userId,
      serviceId: serviceIdBySlug.get(c.s)!,
      planId,
      monthlyPrice: monthlyOf(planId),
      satisfaction: null,
      comment: null,
      startedOn: null,
      status: "cancelled",
      cancelledOn: c.on,
      cancelReason: c.reason,
      cancelReasonDetail: c.detail,
      switchedToServiceId: c.to ? serviceIdBySlug.get(c.to)! : null,
      isHidden: false,
      sortOrder: 100 + i,
      tags: [],
      updatedAt: `${s.updated}T12:00:00Z`,
    };
  });
  return [...active, ...cancelled];
});

// いいね：ハンドルごとの件数をそれらしく散らす
const likeCounts: Record<string, number> = {
  kenji_dev: 9, yuka_design: 6, ryo_pm: 5, haruka_pm: 4, takuya_design: 8,
  editor_shun: 3, daiki_ts: 10, yuki_lab: 7, maki_growth: 4, ren_startup: 5,
  mio_video: 3, sora_student: 2, aya_family: 1,
};
export const likes: Like[] = profiles.flatMap((target) => {
  const n = likeCounts[target.handle] ?? 0;
  return profiles
    .filter((p) => p.id !== target.id)
    .slice(0, n)
    .map((p) => ({ userId: p.id, targetUserId: target.id }));
});

export const seedDataset: Dataset = {
  categories,
  services,
  plans,
  profiles,
  subscriptions,
  likes,
};
