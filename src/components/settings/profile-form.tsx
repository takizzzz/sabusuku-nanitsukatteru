"use client";

import { useActionState, useState } from "react";
import { Avatar } from "@/components/avatar";
import { FormMessage } from "@/components/forms/field";
import { TagInput } from "@/components/forms/tag-input";
import { avatarFrame, FieldError, ProfileSummary, Req, SettingsCard, settingsField, settingsInput, settingsLabel } from "@/components/settings/profile-summary";
import type { ActionState } from "@/lib/actions/common";
import { saveProfile } from "@/lib/actions/profile";
import { SITE_URL } from "@/lib/format";
import { AGE_RANGES, BIO_MAX, DISPLAY_NAME_MAX, OCCUPATIONS } from "@/lib/options";
import type { Profile } from "@/lib/types";

const radioCard =
  "flex min-h-11 items-center gap-2 p-2.5 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container has-checked:bg-primary-fixed has-checked:ring-1 has-checked:ring-primary/40 transition-colors";

/** S-13 プロフィール（F-04）。概要カードとタブ（children）もこのフォームの中に描く */
export function ProfileForm({ profile, suggestions, children }: { profile: Profile; suggestions: string[]; children?: React.ReactNode }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfile, {});
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [tags, setTags] = useState(profile.tags);
  const [occupation, setOccupation] = useState(profile.occupation ?? "");
  const [ageRange, setAgeRange] = useState(profile.ageRange ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const f = state.fields ?? {};
  const url = `${SITE_URL}/@${handle}`;

  return (
    <form action={action} className="flex flex-col gap-space-md">
      <ProfileSummary
        displayName={displayName}
        handle={handle}
        chips={[occupation, ageRange]}
        avatar={
          <>
            <div className={avatarFrame}>
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="object-cover" />
              ) : (
                <Avatar profile={{ ...profile, displayName: displayName || profile.displayName }} size="lg" />
              )}
            </div>
            <label
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md cursor-pointer hover:opacity-90 active:scale-95 transition-transform focus-within:ring-2 focus-within:ring-primary/40"
              aria-label="アイコン画像を変更"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden>
                photo_camera
              </span>
              <input
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>
          </>
        }
        note={
          <p className={`mt-1.5 font-body-sm text-body-sm ${f.avatar ? "text-error font-bold" : "text-on-surface-variant"}`} role={f.avatar ? "alert" : undefined}>
            {f.avatar ?? "アイコン：PNG・JPEG・WebP、2MBまで"}
          </p>
        }
      />

      {children}

      <SettingsCard icon="badge" title="基本情報">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={settingsLabel} htmlFor="displayName">
              表示名
              <Req />
            </label>
            <span className={`num font-body-sm text-body-sm ${displayName.length > DISPLAY_NAME_MAX ? "text-error font-bold" : "text-on-surface-variant"}`}>
              {displayName.length}/{DISPLAY_NAME_MAX}
            </span>
          </div>
          <input
            id="displayName"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className={settingsInput}
            aria-invalid={!!f.displayName}
          />
          <FieldError>{f.displayName}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={settingsLabel} htmlFor="handle">
            ユーザーID（公開URL）
            <Req />
          </label>
          <div
            className={`flex items-center h-11 px-3 rounded-lg bg-surface-container-low focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-surface-container-lowest transition-all ${f.handle ? "ring-2 ring-error/60" : ""}`}
          >
            <span className="font-body-md text-body-md text-on-surface-variant select-none">@</span>
            <input
              id="handle"
              name="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))}
              required
              autoCapitalize="off"
              className="w-full min-w-0 bg-transparent px-1.5 text-on-surface font-body-md text-base md:text-body-md outline-none"
              aria-invalid={!!f.handle}
            />
          </div>
          <div className="p-2 rounded-lg bg-surface-container-high flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0" aria-hidden>
                link
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {SITE_URL}/@<span className="text-on-surface font-headline-sm">{handle}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm active:scale-95 shadow-sm"
            >
              {copied && (
                <span className="material-symbols-outlined text-[14px]" aria-hidden>
                  check
                </span>
              )}
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
          {f.handle ? <FieldError>{f.handle}</FieldError> : <span className="font-body-sm text-body-sm text-on-surface-variant">変えると以前のURLは使えなくなります</span>}
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className={`${settingsLabel} mb-1.5`}>職種</legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {OCCUPATIONS.map((o) => (
              <label key={o} className={radioCard}>
                <input type="radio" name="occupation" value={o} checked={occupation === o} onChange={() => setOccupation(o)} className="accent-primary w-4 h-4 flex-shrink-0" />
                <span className="font-body-md text-body-md text-on-surface">{o}</span>
              </label>
            ))}
            <label className={radioCard}>
              <input type="radio" name="occupation" value="" checked={occupation === ""} onChange={() => setOccupation("")} className="accent-primary w-4 h-4 flex-shrink-0" />
              <span className="font-body-md text-body-md text-on-surface-variant">選ばない</span>
            </label>
          </div>
          <FieldError>{f.occupation}</FieldError>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label className={settingsLabel} htmlFor="ageRange">
            年代
          </label>
          <div className="relative md:max-w-[50%]">
            <select id="ageRange" name="ageRange" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} className={`${settingsInput} appearance-none pr-9`}>
              <option value="">選ばない</option>
              {AGE_RANGES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute right-2.5 top-3 pointer-events-none" aria-hidden>
              expand_more
            </span>
          </div>
          <FieldError>{f.ageRange}</FieldError>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={settingsLabel}>よく使う用途（タグ）</span>
          <TagInput name="tags" value={tags} onChange={setTags} suggestions={suggestions} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={settingsLabel} htmlFor="bio">
              自己紹介・ひとこと
            </label>
            <span className={`num font-body-sm text-body-sm ${bio.length > BIO_MAX ? "text-error font-bold" : "text-on-surface-variant"}`}>
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${settingsField} p-3 resize-none`}
            placeholder="どんな仕事・用途でサブスクを使っているかなど"
            aria-invalid={!!f.bio}
          />
          <FieldError>{f.bio}</FieldError>
        </div>
      </SettingsCard>

      <FormMessage state={state} />

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 z-20 pt-space-xs">
        <button
          className="w-full h-12 rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm shadow-lg hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={pending}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden>
            save
          </span>
          <span>{pending ? "保存中…" : "変更内容を保存する"}</span>
        </button>
      </div>
    </form>
  );
}
