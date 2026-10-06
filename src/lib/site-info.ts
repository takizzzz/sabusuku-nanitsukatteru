// 運営者情報。公開前に Ryuta が記入する。null の項目は「公開前に記入」と表示する
export const OPERATOR = {
  name: null as string | null,
  contact: null as string | null, // メールアドレスかフォームのURL
  court: null as string | null, // 例：東京地方裁判所
};

/** 規約類の版。確定したら draft を false にして日付を入れる */
export const LEGAL_VERSION = { date: "2026年10月6日", draft: true };
