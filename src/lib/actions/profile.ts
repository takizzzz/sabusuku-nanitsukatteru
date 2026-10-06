"use server";

import { revalidatePath } from "next/cache";
import { checkProfile, HANDLE_TAKEN, type ProfileInput } from "../validation";
import type { Visibility } from "../types";
import {
  ensureTagIds,
  normalizeTags,
  refreshPublicPages,
  text,
  UNKNOWN_ERROR,
  writer,
  type ActionState,
} from "./common";

/** プロフィール編集（S-13）。初回はここで作成もできる */
export async function saveProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer();
  if ("error" in w) return { error: w.error };
  const { db, viewer } = w;

  const input: ProfileInput = {
    displayName: text(fd, "displayName") ?? "",
    handle: (text(fd, "handle") ?? "").toLowerCase().replace(/^@/, ""),
    occupation: text(fd, "occupation"),
    ageRange: text(fd, "ageRange"),
    bio: text(fd, "bio"),
  };
  const fields = checkProfile(input);
  if (Object.keys(fields).length) return { fields };

  let avatarUrl: string | undefined;
  const file = fd.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { fields: { avatar: "画像は2MBまでです。" } };
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      return { fields: { avatar: "PNG・JPEG・WebP の画像を選んでください。" } };
    const ext = file.type.split("/")[1];
    const path = `${viewer.userId}/avatar-${Date.now()}.${ext}`;
    const up = await db.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) return { fields: { avatar: "画像をアップロードできませんでした。" } };
    avatarUrl = db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const row = {
    id: viewer.userId,
    handle: input.handle,
    display_name: input.displayName,
    occupation: input.occupation,
    age_range: input.ageRange,
    bio: input.bio,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };
  const { error } = viewer.profile
    ? await db.from("profiles").update(row).eq("id", viewer.userId)
    : await db.from("profiles").insert(row);
  if (error) return error.code === "23505" ? { fields: HANDLE_TAKEN } : { error: UNKNOWN_ERROR };

  const tagIds = await ensureTagIds(db, normalizeTags(fd.getAll("tags")));
  await db.from("user_tags").delete().eq("user_id", viewer.userId);
  if (tagIds.length) await db.from("user_tags").insert(tagIds.map((tag_id) => ({ user_id: viewer.userId, tag_id })));

  refreshPublicPages();
  if (viewer.profile && viewer.profile.handle !== input.handle) revalidatePath(`/u/${viewer.profile.handle}`);
  return { ok: true, message: "プロフィールを保存しました。" };
}

/** 公開範囲（F-11） */
export async function setVisibility(visibility: Visibility): Promise<ActionState> {
  if (!["public", "unlisted", "private"].includes(visibility)) return { error: "公開範囲を選び直してください。" };
  const w = await writer({ needProfile: true });
  if ("error" in w) return { error: w.error };
  const { error } = await w.db.from("profiles").update({ visibility }).eq("id", w.viewer.userId);
  if (error) return { error: UNKNOWN_ERROR };
  refreshPublicPages();
  return { ok: true, message: "公開範囲を変更しました。" };
}
