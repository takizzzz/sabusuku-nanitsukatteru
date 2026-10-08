/** Supabase 未接続のときに出す注意書き */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-dashed border-primary/40 bg-primary-fixed/50 px-4 py-3 text-body-md text-on-primary-fixed-variant">
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]" aria-hidden>
        info
      </span>
      <span>{children ?? "デモ表示中です。ダミーユーザー（@kenji_dev）の画面を表示しています。保存はできません。"}</span>
    </p>
  );
}
