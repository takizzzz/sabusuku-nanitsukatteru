import { SITE_URL } from "@/lib/format";

/** S-13 上部のプロフィール概要カード。アバター部分は呼び出し側で差し込む（プロフィールタブでは画像変更ボタン付き） */
export function ProfileSummary({
  avatar,
  displayName,
  handle,
  chips,
  note,
}: {
  avatar: React.ReactNode;
  displayName: string;
  handle: string;
  chips: (string | null | undefined)[];
  note?: React.ReactNode;
}) {
  const shown = chips.filter((c): c is string => !!c);
  return (
    <section className="w-full rounded-xl bg-surface-container p-space-md md:p-space-lg shadow-sm relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" aria-hidden />
      <div className="relative flex items-center gap-space-md">
        <div className="relative flex-shrink-0">{avatar}</div>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline-md text-headline-md text-on-surface truncate">{displayName || "（表示名なし）"}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {SITE_URL.replace(/^https?:\/\//, "")}/@{handle}
          </p>
          {shown.length > 0 && (
            <div className="flex items-center gap-space-xs mt-1.5 flex-wrap">
              {shown.map((c, i) => (
                <span
                  key={c}
                  className={`px-2 py-0.5 rounded-full bg-surface-container-highest font-label-sm text-label-sm ${i === 0 ? "text-on-surface" : "text-on-surface-variant"}`}
                >
                  {c}
                </span>
              ))}
            </div>
          )}
          {note}
        </div>
      </div>
    </section>
  );
}

/** 設定のセクションカード（見出しアイコン付き） */
export function SettingsCard({
  icon,
  title,
  children,
  tone = "default",
  className = "",
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
  className?: string;
}) {
  const danger = tone === "danger";
  return (
    <section
      className={`rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col ${danger ? "bg-error-container/30 gap-space-sm" : "bg-surface-container-lowest gap-space-md"} ${className}`}
    >
      <div className={`flex items-center gap-space-xs pb-1 ${danger ? "text-error" : ""}`}>
        <span className={`material-symbols-outlined text-[20px] ${danger ? "" : "text-primary"}`} aria-hidden>
          {icon}
        </span>
        <h2 className={`font-headline-sm text-headline-sm ${danger ? "text-error" : "text-on-surface"}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** アバターを 64px に揃える（Avatar の lg は 80px） */
export const avatarFrame = "w-16 h-16 rounded-full overflow-hidden bg-surface-container-high shadow-inner [&>*]:size-16! [&>*]:text-2xl!";

export const settingsField =
  "w-full px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-base md:text-body-md placeholder:text-outline outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 aria-invalid:ring-2 aria-invalid:ring-error/60 transition-all";

export const settingsInput = `${settingsField} h-11`;

export const settingsLabel = "font-label-md text-label-md text-on-surface";

export function Req() {
  return <span className="text-tertiary"> *</span>;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="font-body-sm text-body-sm text-error font-bold" role="alert">
      {children}
    </p>
  );
}
