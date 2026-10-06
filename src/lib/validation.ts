import { AGE_RANGES, BIO_MAX, DISPLAY_NAME_MAX, HANDLE_PATTERN, OCCUPATIONS } from "./options";

const RESERVED = new Set(["admin", "me", "settings", "login", "signup", "welcome", "about", "terms", "privacy", "ads", "api"]);

export type ProfileInput = {
  displayName: string;
  handle: string;
  occupation: string | null;
  ageRange: string | null;
  bio?: string | null;
};

/** プロフィール項目の検証。問題があれば項目ごとのメッセージを返す */
export function checkProfile(p: ProfileInput): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!p.displayName) fields.displayName = "表示名を入力してください。";
  else if (p.displayName.length > DISPLAY_NAME_MAX) fields.displayName = `表示名は${DISPLAY_NAME_MAX}文字までです。`;
  if (!HANDLE_PATTERN.test(p.handle)) fields.handle = "ユーザーIDは半角英小文字・数字・_ の3〜20文字です。";
  else if (RESERVED.has(p.handle)) fields.handle = "このユーザーIDは使えません。";
  if (p.occupation && !(OCCUPATIONS as readonly string[]).includes(p.occupation)) fields.occupation = "職種を選び直してください。";
  if (p.ageRange && !(AGE_RANGES as readonly string[]).includes(p.ageRange)) fields.ageRange = "年代を選び直してください。";
  if (p.bio && p.bio.length > BIO_MAX) fields.bio = `自己紹介は${BIO_MAX}文字までです。`;
  return fields;
}

export const HANDLE_TAKEN = { handle: "このユーザーIDはすでに使われています。" };

