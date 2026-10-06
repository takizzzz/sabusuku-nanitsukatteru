export function yen(n: number): string {
  return n.toLocaleString("ja-JP");
}

/** "2026-08" → "2026年8月" */
export function yearMonth(ym: string | null): string {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
}

/** 更新日時の相対表示（日単位） */
export function relativeDay(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}か月前`;
}

export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export const SITE_NAME = "さぶすくなにつかってる！？";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
