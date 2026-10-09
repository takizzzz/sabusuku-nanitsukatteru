/** 運営が作成したサンプル構成の印 */
export function SampleBadge() {
  return (
    <span className="inline-flex w-fit shrink-0 self-start items-center gap-0.5 rounded-full lg:self-center bg-tertiary-fixed px-1.5 py-0.5 font-label-sm text-label-sm text-on-tertiary-fixed-variant">
      <span className="material-symbols-outlined text-[12px]" aria-hidden>
        science
      </span>
      サンプル
    </span>
  );
}

/** サンプル構成のページ上部に出す説明 */
export function SampleNotice() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-tertiary-fixed px-4 py-3 font-body-md text-body-md text-on-tertiary-fixed-variant">
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]" aria-hidden>
        info
      </span>
      <span>これは運営が作成したサンプルの構成です。実在の人の構成や感想ではありません。ランキングや平均などの集計にも含めていません。</span>
    </p>
  );
}
