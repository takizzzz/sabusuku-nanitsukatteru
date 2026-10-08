"use client";

import { useActionState, useState } from "react";
import { Camera, Check, Copy, Save } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Field, FormMessage, inputCls, primaryBtn } from "@/components/forms/field";
import { TagInput } from "@/components/forms/tag-input";
import type { ActionState } from "@/lib/actions/common";
import { saveProfile } from "@/lib/actions/profile";
import { SITE_URL } from "@/lib/format";
import { AGE_RANGES, BIO_MAX, DISPLAY_NAME_MAX, OCCUPATIONS } from "@/lib/options";
import type { Profile } from "@/lib/types";

/** S-13 プロフィール（F-04） */
export function ProfileForm({ profile, suggestions }: { profile: Profile; suggestions: string[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfile, {});
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [tags, setTags] = useState(profile.tags);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const f = state.fields ?? {};
  const url = `${SITE_URL}/@${handle}`;

  return (
    <form action={action} className="space-y-5">
      <section className="space-y-5 rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer" aria-label="アイコン画像を変更">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-20 rounded-full object-cover" />
            ) : (
              <Avatar profile={{ ...profile, displayName: displayName || profile.displayName }} size="lg" />
            )}
            <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-accent text-on-accent shadow">
              <Camera className="size-4" aria-hidden />
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
          <div className="text-xs text-subtle">
            <p className="font-bold text-fg">アイコン</p>
            PNG・JPEG・WebP、2MBまで
            {f.avatar && <p className="mt-1 font-bold text-danger">{f.avatar}</p>}
          </div>
        </div>

        <Field label="表示名" htmlFor="displayName" required error={f.displayName} counter={{ value: displayName.length, max: DISPLAY_NAME_MAX }}>
          <input id="displayName" name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={inputCls} />
        </Field>

        <Field label="ユーザーID（公開URL）" htmlFor="handle" required error={f.handle} hint="変えると以前のURLは使えなくなります">
          <div className="flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent">
            <span className="pl-3 text-subtle">@</span>
            <input
              id="handle"
              name="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))}
              required
              autoCapitalize="off"
              className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-base outline-none md:text-sm"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-accent-soft/60 px-3 py-2 text-xs">
            <span className="min-w-0 flex-1 truncate text-accent-strong">{url}</span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex min-h-8 items-center gap-1 rounded-md bg-card px-2 font-bold"
            >
              {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
        </Field>

        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
            職種<span className="rounded bg-surface-3 px-1.5 py-px text-[10px] text-subtle">任意</span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {OCCUPATIONS.map((o) => (
              <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm has-checked:border-accent has-checked:bg-accent-soft/50">
                <input type="radio" name="occupation" value={o} defaultChecked={profile.occupation === o} className="accent-[var(--accent)]" />
                {o}
              </label>
            ))}
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-sm text-subtle has-checked:border-accent">
              <input type="radio" name="occupation" value="" defaultChecked={!profile.occupation} className="accent-[var(--accent)]" />
              選ばない
            </label>
          </div>
          {f.occupation && <p className="mt-1 text-xs font-bold text-danger">{f.occupation}</p>}
        </fieldset>

        <Field label="年代" optional htmlFor="ageRange" error={f.ageRange}>
          <select id="ageRange" name="ageRange" defaultValue={profile.ageRange ?? ""} className={inputCls}>
            <option value="">選ばない</option>
            {AGE_RANGES.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>

        <Field label="よく使う用途（タグ）" optional>
          <TagInput name="tags" value={tags} onChange={setTags} suggestions={suggestions} />
        </Field>

        <Field label="自己紹介" optional htmlFor="bio" error={f.bio} counter={{ value: bio.length, max: BIO_MAX }}>
          <textarea id="bio" name="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputCls} py-2`} placeholder="どんな仕事・用途でサブスクを使っているかなど" />
        </Field>
      </section>
      <FormMessage state={state} />
      <button className={`${primaryBtn} w-full`} disabled={pending}>
        <Save className="size-4" aria-hidden />
        {pending ? "保存中…" : "変更内容を保存する"}
      </button>
    </form>
  );
}
