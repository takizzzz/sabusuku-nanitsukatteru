import { Info } from "lucide-react";

/** Supabase 未接続のときに出す注意書き */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-dashed border-accent/50 bg-accent-soft/50 px-4 py-3 text-sm text-accent-strong">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children ?? "デモ表示中です。ダミーユーザー（@kenji_dev）の画面を表示しています。保存はできません。"}</span>
    </p>
  );
}
