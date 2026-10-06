import type { Metadata } from "next";
import Link from "next/link";
import { Eye, UserRound, UserRoundCog } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { DemoNotice } from "@/components/demo-notice";
import { DeleteAccountForm, PasswordForm, SignOutButton, VisibilityForm } from "@/components/settings/account-forms";
import { ProfileForm } from "@/components/settings/profile-form";
import { requireProfile } from "@/lib/auth";
import { getIndex } from "@/lib/data";
import { SITE_URL } from "@/lib/format";
import { popularTags } from "@/lib/stacks";

export const metadata: Metadata = { title: "設定", robots: { index: false } };

const TABS = [
  { id: "profile", label: "プロフィール", icon: UserRound },
  { id: "visibility", label: "公開範囲", icon: Eye },
  { id: "account", label: "アカウント", icon: UserRoundCog },
] as const;

/** S-13 プロフィール・アカウント設定 */
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "profile";
  const viewer = await requireProfile(`/settings?tab=${tab}`);
  const { profile } = viewer;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 md:py-10">
      <header className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-accent-soft to-surface-2 p-5">
        <Avatar profile={profile} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold">{profile.displayName}</h1>
          <p className="truncate text-xs text-muted">{SITE_URL.replace(/^https?:\/\//, "")}/@{profile.handle}</p>
          {profile.occupation && <p className="mt-1 inline-block rounded bg-surface px-2 py-0.5 text-xs font-bold">{profile.occupation}</p>}
        </div>
      </header>
      {viewer.demo && <DemoNotice />}

      <nav className="grid grid-cols-3 rounded-xl bg-surface-3 p-1" aria-label="設定の種類">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={`/settings?tab=${id}`}
            aria-current={tab === id ? "page" : undefined}
            replace
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-bold ${tab === id ? "bg-surface text-accent-strong shadow-sm" : "text-muted"}`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      {tab === "profile" && <ProfileForm profile={profile} suggestions={popularTags(await getIndex(), 16)} />}
      {tab === "visibility" && <VisibilityForm value={profile.visibility} />}
      {tab === "account" && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-extrabold">ログイン情報</h2>
            <p className="mt-2 text-sm">
              メールアドレス：<span className="font-bold">{viewer.email ?? "（ソーシャルログイン）"}</span>
            </p>
          </section>
          <PasswordForm reset={sp.reset === "1"} />
          <SignOutButton />
          <DeleteAccountForm confirmText={profile.handle} />
        </div>
      )}
    </div>
  );
}
