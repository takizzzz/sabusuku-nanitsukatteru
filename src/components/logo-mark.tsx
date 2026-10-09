/** ロゴマーク：重なったサブスクのカード＋「！？」のしるし（外部画像は使わない） */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden>
      <rect x="3" y="9" width="20" height="16" rx="4" className="fill-primary-fixed" transform="rotate(-8 13 17)" />
      <rect x="7" y="8" width="20" height="16" rx="4" className="fill-primary-container" />
      <rect x="10.5" y="12" width="8" height="2.4" rx="1.2" fill="white" opacity="0.9" />
      <rect x="10.5" y="16.5" width="12" height="2.4" rx="1.2" fill="white" opacity="0.55" />
      <circle cx="26" cy="7" r="5" className="fill-tertiary-container" />
      <path d="M26 4.2v3.4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="26" cy="9.9" r="1" fill="white" />
    </svg>
  );
}
