import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { DemoNotice } from "@/components/demo-notice";
import { DeleteAccountForm, LoginInfoCard, VisibilityForm } from "@/components/settings/account-forms";
import { ProfileForm } from "@/components/settings/profile-form";
import { avatarFrame, ProfileSummary } from "@/components/settings/profile-summary";
import { requireProfile } from "@/lib/auth";
import { getIndex } from "@/lib/data";
import { popularTags } from "@/lib/stacks";

export const metadata: Metadata = { title: "設定", robots: { index: false } };

const TABS = [
  { id: "profile", label: "プロフィール", icon: "person" },
  { id: "visibility", label: "公開範囲", icon: "tune" },
  { id: "account", label: "アカウント", icon: "manage_accounts" },
] as const;

/** S-13 プロフィール・アカウント設定 */
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === sp.tab)?.id ?? "profile";
  const viewer = await requireProfile(`/settings?tab=${tab}`);
  const { profile } = viewer;

  const nav = (
    <>
      <nav className="flex p-1 rounded-xl bg-surface-container-low shadow-sm" aria-label="設定の種類">
        {TABS.map(({ id, label, icon }) => (
          <Link
            key={id}
            href={`/settings?tab=${id}`}
            aria-current={tab === id ? "page" : undefined}
            replace
            className={`flex-1 min-h-11 py-2 px-space-xs rounded-lg font-headline-sm text-label-md min-[400px]:text-headline-sm whitespace-nowrap text-center transition-all flex items-center justify-center gap-1 ${
              tab === id ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden>
              {icon}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {viewer.demo && <DemoNotice />}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-space-md px-margin-mobile pt-space-md pb-space-xl md:pt-space-xl">
      {tab === "profile" ? (
        <ProfileForm profile={profile} suggestions={popularTags(await getIndex(), 16)}>
          {nav}
        </ProfileForm>
      ) : (
        <>
          <ProfileSummary
            displayName={profile.displayName}
            handle={profile.handle}
            chips={[profile.occupation, profile.ageRange]}
            avatar={
              <div className={avatarFrame}>
                <Avatar profile={profile} size="lg" />
              </div>
            }
          />
          {nav}
          {tab === "visibility" && <VisibilityForm value={profile.visibility} />}
          {tab === "account" && (
            <>
              <LoginInfoCard email={viewer.email ?? null} reset={sp.reset === "1"} />
              <DeleteAccountForm confirmText={profile.handle} />
            </>
          )}
        </>
      )}
    </div>
  );
}
