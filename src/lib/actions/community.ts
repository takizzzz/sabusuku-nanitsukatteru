"use server";

import { getIndex } from "../data";
import { REPORT_REASONS, USD_JPY_REFERENCE } from "../options";
import { refreshPublicPages, int, text, UNKNOWN_ERROR, writer, type ActionState } from "./common";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LikeResult = { liked?: boolean; count?: number; needLogin?: boolean; error?: string };

/** いいね（F-13）の切り替え */
export async function toggleLike(targetUserId: string): Promise<LikeResult> {
  const w = await writer({ needProfile: true });
  if ("error" in w) return w.error.startsWith("ログイン") ? { needLogin: true } : { error: w.error };
  if (!UUID.test(targetUserId) || targetUserId === w.viewer.userId) return { error: "自分の構成にはいいねできません。" };
  const { db, viewer } = w;
  const { data: existing } = await db
    .from("likes")
    .select("user_id")
    .eq("user_id", viewer.userId)
    .eq("target_user_id", targetUserId)
    .maybeSingle();
  const { error } = existing
    ? await db.from("likes").delete().eq("user_id", viewer.userId).eq("target_user_id", targetUserId)
    : await db.from("likes").insert({ user_id: viewer.userId, target_user_id: targetUserId });
  if (error) return { error: UNKNOWN_ERROR };
  const { count } = await db.from("likes").select("*", { count: "exact", head: true }).eq("target_user_id", targetUserId);
  refreshPublicPages();
  return { liked: !existing, count: count ?? 0 };
}

/** 通報（F-20） */
export async function createReport(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer();
  if ("error" in w) return { error: w.error };
  const type = fd.get("type") === "comment" ? "comment" : "stack";
  const targetId = text(fd, "targetId") ?? "";
  const reason = text(fd, "reason");
  const detail = text(fd, "detail");
  const fields: Record<string, string> = {};
  if (!REPORT_REASONS.some((r) => r.id === reason)) fields.reason = "通報の理由を選んでください。";
  if (detail && detail.length > 500) fields.detail = "詳細は500文字までです。";
  if (Object.keys(fields).length) return { fields };
  if (!UUID.test(targetId)) return { error: "通報の対象が見つかりません。" };
  const { error } = await w.db.from("reports").insert({
    reporter_id: w.viewer.userId,
    target_type: type,
    target_id: targetId,
    reason,
    detail,
  });
  if (error) return { error: UNKNOWN_ERROR };
  return { ok: true, message: "通報を受け付けました。運営で内容を確認します。" };
}

/** マスタにないサービスの追加申請（F-08） */
export async function createServiceRequest(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer();
  if ("error" in w) return { error: w.error };
  const idx = await getIndex();
  const name = text(fd, "name");
  const url = text(fd, "url");
  const categoryId = int(fd, "categoryId");
  const planName = text(fd, "planName");
  const price = int(fd, "price");
  const currency = fd.get("currency") === "USD" ? "USD" : "JPY";
  const comment = text(fd, "comment");

  const fields: Record<string, string> = {};
  if (!name) fields.name = "サービス名を入力してください。";
  else if (name.length > 50) fields.name = "サービス名は50文字までです。";
  if (!url || !/^https?:\/\/[^\s]+\.[^\s]+/.test(url)) fields.url = "公式サイトのURLを https:// から入力してください。";
  if (categoryId === null || !idx.categories.has(categoryId)) fields.categoryId = "カテゴリを選んでください。";
  if (planName && planName.length > 50) fields.planName = "プラン名は50文字までです。";
  if (price !== null && (!Number.isInteger(price) || price < 0)) fields.price = "金額は0以上の整数で入力してください。";
  if (comment && comment.length > 300) fields.comment = "ひとことは300文字までです。";
  if (Object.keys(fields).length) return { fields };

  const dup = idx.ds.services.find((s) => s.name.toLowerCase() === name!.toLowerCase());
  if (dup) return { fields: { name: `「${dup.name}」はすでに登録されています。サブスクの追加から選べます。` } };

  const { error } = await w.db.from("service_requests").insert({
    user_id: w.viewer.userId,
    name,
    url,
    category_id: categoryId,
    plan_name: planName,
    price,
    currency: price === null ? null : currency,
    comment,
  });
  if (error) return { error: UNKNOWN_ERROR };
  const yen = currency === "USD" && price !== null ? `（約¥${(price * USD_JPY_REFERENCE).toLocaleString("ja-JP")}）` : "";
  return { ok: true, message: `「${name}」${yen}の追加申請を受け付けました。運営が確認して登録します。` };
}
