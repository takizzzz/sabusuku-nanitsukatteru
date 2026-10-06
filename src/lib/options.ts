// 入力フォームで使う選択肢。要件定義書 11章「選択肢リスト」が決まったらここを差し替える。

export const OCCUPATIONS = [
  "Webエンジニア",
  "UI/UXデザイナー",
  "プロダクトマネージャー",
  "マーケター",
  "ライター・編集",
  "動画クリエイター",
  "学生・研究者",
  "経営者・個人事業主",
  "その他",
] as const;

export const AGE_RANGES = ["10代", "20代", "30代", "40代", "50代以上"] as const;

export const CANCEL_REASONS = [
  "料金が高い",
  "使う頻度が減った",
  "他サービスで代替できた",
  "機能が物足りない",
  "品質が下がった",
  "その他",
] as const;

export const REPORT_REASONS = [
  { id: "spam", label: "スパム・宣伝目的", help: "アフィリエイトや宣伝目的の投稿、自動投稿など" },
  { id: "harassment", label: "誹謗中傷・嫌がらせ", help: "特定の人への攻撃、差別的な表現など" },
  { id: "fake", label: "虚偽の情報・不正なリンク", help: "事実と異なる料金、詐欺サイトへの誘導など" },
  { id: "privacy", label: "著作権侵害・個人情報の掲載", help: "他人の文章や画像の無断使用、本名や連絡先の掲載など" },
  { id: "other", label: "その他", help: "上記に当てはまらない規約違反" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

/** USD 入力を円に直すときの目安レート。申請の参考値にだけ使う */
export const USD_JPY_REFERENCE = 150;

export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;
export const COMMENT_MAX = 200;
export const BIO_MAX = 200;
export const DISPLAY_NAME_MAX = 30;
export const TAG_MAX = 20;
