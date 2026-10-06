import Link from "next/link";

/** まだ実装していない画面の仮置き */
export function ComingSoon({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="mt-3 text-muted">{children ?? "この画面は準備中です。"}</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-bold">
        トップへ戻る
      </Link>
    </div>
  );
}
