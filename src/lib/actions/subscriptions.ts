"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getIndex } from "../data";
import { CANCEL_REASONS, COMMENT_MAX } from "../options";
import type { Visibility } from "../types";
import { checkProfile, HANDLE_TAKEN, type ProfileInput } from "../validation";
import {
  ensureTagIds,
  int,
  normalizeTags,
  refreshPublicPages,
  text,
  UNKNOWN_ERROR,
  writer,
  type ActionState,
} from "./common";

export type SubscriptionInput = {
  serviceId: string;
  planId: string | null;
  monthlyPrice: number | null;
  satisfaction: number | null;
  tags: string[];
  comment: string | null;
  startedOn: string | null; // YYYY-MM
  status: "active" | "cancelled";
  cancelledOn: string | null;
  cancelReason: string | null;
  cancelReasonDetail: string | null;
  switchedToServiceId: string | null;
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

async function check(s: SubscriptionInput): Promise<Record<string, string>> {
  const idx = await getIndex();
  const fields: Record<string, string> = {};
  if (!idx.services.has(s.serviceId)) fields.serviceId = "サービスを選んでください。";
  if (s.planId && idx.plans.get(s.planId)?.serviceId !== s.serviceId) fields.planId = "プランを選び直してください。";
  if (s.monthlyPrice === null || !Number.isInteger(s.monthlyPrice) || s.monthlyPrice < 0 || s.monthlyPrice > 1_000_000)
    fields.monthlyPrice = "月額を0以上の整数（円）で入力してください。";
  if (s.satisfaction !== null && !(Number.isInteger(s.satisfaction) && s.satisfaction >= 1 && s.satisfaction <= 5))
    fields.satisfaction = "満足度は★1〜5で選んでください。";
  if (s.comment && s.comment.length > COMMENT_MAX) fields.comment = `使い方コメントは${COMMENT_MAX}文字までです。`;
  if (s.startedOn && !MONTH.test(s.startedOn)) fields.startedOn = "開始年月を選び直してください。";
  if (s.status === "cancelled") {
    if (s.cancelledOn && !MONTH.test(s.cancelledOn)) fields.cancelledOn = "解約年月を選び直してください。";
    if (s.cancelReason && !(CANCEL_REASONS as readonly string[]).includes(s.cancelReason))
      fields.cancelReason = "解約理由を選び直してください。";
    if (s.cancelReasonDetail && s.cancelReasonDetail.length > COMMENT_MAX)
      fields.cancelReasonDetail = `解約理由の詳細は${COMMENT_MAX}文字までです。`;
    if (s.switchedToServiceId && (!idx.services.has(s.switchedToServiceId) || s.switchedToServiceId === s.serviceId))
      fields.switchedToServiceId = "乗り換え先を選び直してください。";
  }
  return fields;
}

const day = (m: string | null) => (m ? `${m}-01` : null);

function toRow(userId: string, s: SubscriptionInput) {
  const cancelled = s.status === "cancelled";
  return {
    user_id: userId,
    service_id: s.serviceId,
    plan_id: s.planId,
    monthly_price: s.monthlyPrice,
    satisfaction: s.satisfaction,
    comment: s.comment,
    started_on: day(s.startedOn),
    status: s.status,
    cancelled_on: cancelled ? day(s.cancelledOn) : null,
    cancel_reason: cancelled ? s.cancelReason : null,
    cancel_reason_detail: cancelled ? s.cancelReasonDetail : null,
    switched_to_service_id: cancelled ? s.switchedToServiceId : null,
  };
}

async function replaceTags(db: SupabaseClient, subId: string, tags: string[]) {
  const ids = await ensureTagIds(db, tags);
  await db.from("user_subscription_tags").delete().eq("user_subscription_id", subId);
  if (ids.length)
    await db.from("user_subscription_tags").insert(ids.map((tag_id) => ({ user_subscription_id: subId, tag_id })));
}

function fromForm(fd: FormData): SubscriptionInput {
  return {
    serviceId: text(fd, "serviceId") ?? "",
    planId: text(fd, "planId"),
    monthlyPrice: int(fd, "monthlyPrice"),
    satisfaction: int(fd, "satisfaction"),
    tags: normalizeTags(fd.getAll("tags")),
    comment: text(fd, "comment"),
    startedOn: text(fd, "startedOn"),
    status: fd.get("status") === "cancelled" ? "cancelled" : "active",
    cancelledOn: text(fd, "cancelledOn"),
    cancelReason: text(fd, "cancelReason"),
    cancelReasonDetail: text(fd, "cancelReasonDetail"),
    switchedToServiceId: text(fd, "switchedToServiceId"),
  };
}

/** サブスクの追加・編集（S-11） */
export async function saveSubscription(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer({ needProfile: true });
  if ("error" in w) return { error: w.error };
  const input = fromForm(fd);
  const fields = await check(input);
  if (Object.keys(fields).length) return { fields };

  const id = text(fd, "id");
  const row = toRow(w.viewer.userId, input);
  let subId = id;
  if (id) {
    const { error } = await w.db.from("user_subscriptions").update(row).eq("id", id).eq("user_id", w.viewer.userId);
    if (error) return { error: UNKNOWN_ERROR };
  } else {
    const { data: last } = await w.db
      .from("user_subscriptions")
      .select("sort_order")
      .eq("user_id", w.viewer.userId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await w.db
      .from("user_subscriptions")
      .insert({ ...row, sort_order: (last?.sort_order ?? -1) + 1 })
      .select("id")
      .single();
    if (error) return { error: UNKNOWN_ERROR };
    subId = data.id;
  }
  await replaceTags(w.db, subId!, input.tags);
  refreshPublicPages();
  return { ok: true, message: id ? "保存しました。" : "構成に追加しました。" };
}

export async function deleteSubscription(id: string): Promise<ActionState> {
  const w = await writer({ needProfile: true });
  if ("error" in w) return { error: w.error };
  const { error } = await w.db.from("user_subscriptions").delete().eq("id", id).eq("user_id", w.viewer.userId);
  if (error) return { error: UNKNOWN_ERROR };
  refreshPublicPages();
  return { ok: true, message: "削除しました。" };
}

/** サブスク単位の非公開（F-09） */
export async function setHidden(id: string, hidden: boolean): Promise<ActionState> {
  const w = await writer({ needProfile: true });
  if ("error" in w) return { error: w.error };
  const { error } = await w.db
    .from("user_subscriptions")
    .update({ is_hidden: hidden })
    .eq("id", id)
    .eq("user_id", w.viewer.userId);
  if (error) return { error: UNKNOWN_ERROR };
  refreshPublicPages();
  return { ok: true, message: hidden ? "このサブスクを非公開にしました。" : "このサブスクを公開しました。" };
}

/** 再契約：解約済みを契約中に戻す */
export async function reactivate(id: string): Promise<ActionState> {
  const w = await writer({ needProfile: true });
  if ("error" in w) return { error: w.error };
  const { error } = await w.db
    .from("user_subscriptions")
    .update({ status: "active", cancelled_on: null, cancel_reason: null, cancel_reason_detail: null, switched_to_service_id: null })
    .eq("id", id)
    .eq("user_id", w.viewer.userId);
  if (error) return { error: UNKNOWN_ERROR };
  refreshPublicPages();
  return { ok: true, message: "契約中に戻しました。" };
}

/** 並び替え（F-09）。ids は表示順 */
export async function reorder(ids: string[]): Promise<ActionState> {
  const w = await writer({ needProfile: true });
  if ("error" in w) return { error: w.error };
  const results = await Promise.all(
    ids.map((id, i) =>
      w.db.from("user_subscriptions").update({ sort_order: i }).eq("id", id).eq("user_id", w.viewer.userId),
    ),
  );
  if (results.some((r) => r.error)) return { error: UNKNOWN_ERROR };
  refreshPublicPages();
  return { ok: true };
}

export type OnboardingInput = {
  profile: ProfileInput;
  visibility: Visibility;
  items: Omit<SubscriptionInput, "status" | "cancelledOn" | "cancelReason" | "cancelReasonDetail" | "switchedToServiceId">[];
};

export type OnboardingResult = ActionState & { handle?: string; step?: number };

/** オンボーディング（S-09）の完了。プロフィール作成と契約の一括登録 */
export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const w = await writer();
  if ("error" in w) return { error: w.error };
  const { db, viewer } = w;

  const profile = { ...input.profile, handle: input.profile.handle.toLowerCase() };
  const pf = checkProfile(profile);
  if (Object.keys(pf).length) return { fields: pf, step: 1 };
  if (!["public", "unlisted", "private"].includes(input.visibility)) return { error: "公開範囲を選んでください。", step: 3 };
  if (input.items.length === 0) return { error: "サブスクを1つ以上選んでください。", step: 2 };
  const items = input.items.map((i) => ({
    ...i,
    tags: normalizeTags(i.tags),
    status: "active" as const,
    cancelledOn: null,
    cancelReason: null,
    cancelReasonDetail: null,
    switchedToServiceId: null,
  }));
  for (const item of items) {
    const f = await check(item);
    if (Object.keys(f).length) return { error: `入力内容を確認してください：${Object.values(f)[0]}`, step: 3 };
  }

  const row = {
    id: viewer.userId,
    handle: profile.handle,
    display_name: profile.displayName,
    occupation: profile.occupation,
    age_range: profile.ageRange,
    visibility: input.visibility,
  };
  const { error } = viewer.profile
    ? await db.from("profiles").update(row).eq("id", viewer.userId)
    : await db.from("profiles").insert(row);
  if (error) return error.code === "23505" ? { fields: HANDLE_TAKEN, step: 1 } : { error: UNKNOWN_ERROR };

  const { data: existing } = await db.from("user_subscriptions").select("service_id, sort_order").eq("user_id", viewer.userId);
  const have = new Set((existing ?? []).map((e) => e.service_id));
  let order = Math.max(-1, ...(existing ?? []).map((e) => e.sort_order)) + 1;
  for (const item of items) {
    if (have.has(item.serviceId)) continue;
    const { data, error: e } = await db
      .from("user_subscriptions")
      .insert({ ...toRow(viewer.userId, item), sort_order: order++ })
      .select("id")
      .single();
    if (e) return { error: UNKNOWN_ERROR, step: 3 };
    await replaceTags(db, data.id, item.tags);
  }
  refreshPublicPages();
  return { ok: true, handle: profile.handle };
}
