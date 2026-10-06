"use server";

import { revalidatePath } from "next/cache";
import { int, refreshPublicPages, text, UNKNOWN_ERROR, writer, type ActionState } from "./common";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const done = (message: string): ActionState => {
  revalidatePath("/admin");
  refreshPublicPages();
  return { ok: true, message };
};

/** サービスマスタの追加・編集（F-21, F-22） */
export async function saveService(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  const id = text(fd, "id");
  const slug = text(fd, "slug") ?? "";
  const name = text(fd, "name");
  const categoryId = int(fd, "categoryId");
  if (!SLUG.test(slug)) return { error: "slug は半角英小文字・数字・ハイフンで入力してください。" };
  if (!name) return { error: "サービス名を入力してください。" };
  if (categoryId === null || Number.isNaN(categoryId)) return { error: "カテゴリを選んでください。" };
  const row = {
    slug,
    name,
    company: text(fd, "company"),
    category_id: categoryId,
    official_url: text(fd, "officialUrl"),
    affiliate_url: text(fd, "affiliateUrl"),
    affiliate_active: fd.get("affiliateActive") === "on",
    brand_color: text(fd, "brandColor"),
    logo_url: text(fd, "logoUrl"),
    status: (["active", "pending", "archived"] as const).find((s) => s === fd.get("status")) ?? "active",
  };
  const { error } = id ? await w.db.from("services").update(row).eq("id", id) : await w.db.from("services").insert(row);
  if (error) return { error: error.code === "23505" ? "この slug は使われています。" : UNKNOWN_ERROR };
  return done(id ? `${name} を保存しました。` : `${name} を追加しました。`);
}

export async function savePlan(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  const id = text(fd, "id");
  const name = text(fd, "name");
  const price = int(fd, "price");
  const checked = text(fd, "priceCheckedAt");
  if (!name || price === null || Number.isNaN(price) || price < 0 || !checked)
    return { error: "プラン名・価格・価格確認日を入力してください。" };
  const row = {
    service_id: text(fd, "serviceId"),
    name,
    price,
    billing_cycle: fd.get("billingCycle") === "yearly" ? "yearly" : "monthly",
    price_checked_at: checked,
  };
  const { error } = id ? await w.db.from("plans").update(row).eq("id", id) : await w.db.from("plans").insert(row);
  if (error) return { error: UNKNOWN_ERROR };
  return done(`プラン「${name}」を保存しました。`);
}

export async function deletePlan(id: string): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  const { error } = await w.db.from("plans").delete().eq("id", id);
  if (error) return { error: UNKNOWN_ERROR };
  return done("プランを削除しました。");
}

/** 申請の承認：サービスを作って申請を承認済みにする */
export async function approveRequest(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  const requestId = text(fd, "requestId");
  const slug = text(fd, "slug") ?? "";
  const name = text(fd, "name");
  const categoryId = int(fd, "categoryId");
  if (!requestId || !name || !SLUG.test(slug) || categoryId === null || Number.isNaN(categoryId))
    return { error: "slug・サービス名・カテゴリを確認してください。" };
  const { data, error } = await w.db
    .from("services")
    .insert({ slug, name, category_id: categoryId, official_url: text(fd, "url"), company: text(fd, "company") })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "この slug は使われています。" : UNKNOWN_ERROR };
  await w.db.from("service_requests").update({ status: "approved", approved_service_id: data.id }).eq("id", requestId);
  return done(`${name} をマスタに追加しました。プランはサービスマスタのタブで登録してください。`);
}

export async function rejectRequest(id: string): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  const { error } = await w.db.from("service_requests").update({ status: "rejected" }).eq("id", id);
  if (error) return { error: UNKNOWN_ERROR };
  return done("申請を却下しました。");
}

/** 通報の対応（F-23）。hide は対象を非表示にして対応済みにする */
export async function handleReport(id: string, action: "hide" | "resolve" | "dismiss"): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  const { data: report, error } = await w.db.from("reports").select("*").eq("id", id).single();
  if (error) return { error: UNKNOWN_ERROR };
  if (action === "hide") {
    const r =
      report.target_type === "comment"
        ? await w.db.from("user_subscriptions").update({ is_hidden: true }).eq("id", report.target_id)
        : await w.db.from("profiles").update({ visibility: "private" }).eq("id", report.target_id);
    if (r.error) return { error: UNKNOWN_ERROR };
  }
  await w.db
    .from("reports")
    .update({ status: action === "dismiss" ? "dismissed" : "resolved" })
    .eq("id", id);
  return done(action === "hide" ? "対象を非表示にしました。" : action === "dismiss" ? "対応不要にしました。" : "対応済みにしました。");
}

export async function setUserStatus(userId: string, status: "active" | "suspended"): Promise<ActionState> {
  const w = await writer({ admin: true });
  if ("error" in w) return { error: w.error };
  if (userId === w.viewer.userId) return { error: "自分は停止できません。" };
  const { error } = await w.db.from("profiles").update({ status }).eq("id", userId);
  if (error) return { error: UNKNOWN_ERROR };
  return done(status === "suspended" ? "利用停止にしました。" : "停止を解除しました。");
}
