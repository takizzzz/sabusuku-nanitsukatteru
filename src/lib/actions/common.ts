import "server-only";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_MESSAGE, getViewer, type Viewer } from "../auth";
import { safeNextPath, SITE_URL } from "../format";
import { TAG_MAX } from "../options";
import { createSupabaseServer } from "../supabase/server";

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** 項目ごとのエラー */
  fields?: Record<string, string>;
};

type Writer = { db: SupabaseClient; viewer: Viewer } | { error: string };

/** 書き込み前の共通チェック。未ログイン・デモ・停止中を弾く */
export async function writer(opts: { needProfile?: boolean; admin?: boolean } = {}): Promise<Writer> {
  const viewer = await getViewer();
  if (!viewer) return { error: "ログインしてください。" };
  if (viewer.demo) return { error: DEMO_MESSAGE };
  if (opts.needProfile && !viewer.profile) return { error: "先にプロフィールを作成してください。" };
  if (viewer.profile?.status === "suspended") return { error: "このアカウントは利用停止中です。" };
  if (opts.admin && viewer.profile?.role !== "admin") return { error: "管理者のみ操作できます。" };
  return { db: await createSupabaseServer(), viewer };
}

/** フォームの文字列項目。空なら null */
export function text(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function int(fd: FormData, key: string): number | null {
  const t = text(fd, key);
  if (t === null) return null;
  const n = Number(t.replace(/[,，]/g, ""));
  return Number.isInteger(n) ? n : NaN;
}

/** 用途タグ。重複と空を除き、長さを揃える */
export function normalizeTags(values: unknown[]): string[] {
  const out = new Set<string>();
  for (const v of values) {
    if (typeof v !== "string") continue;
    const t = v.replace(/^#/, "").trim().slice(0, TAG_MAX);
    if (t) out.add(t);
  }
  return [...out].slice(0, 10);
}

/** タグ名を ID にする。無いものは作る */
export async function ensureTagIds(db: SupabaseClient, names: string[]): Promise<number[]> {
  if (names.length === 0) return [];
  const { error } = await db
    .from("tags")
    .upsert(names.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
  if (error) throw error;
  const { data, error: e2 } = await db.from("tags").select("id, name").in("name", names);
  if (e2) throw e2;
  return data.map((t) => t.id);
}

/** 他サイトへ飛ばないよう、サイト内の相対パスだけ通す */
export function safeNext(next: unknown): string {
  return safeNextPath(typeof next === "string" ? next : undefined);
}

export async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : SITE_URL;
}

/** 公開ページ・集計に反映する */
export function refreshPublicPages() {
  revalidatePath("/", "layout");
}

export const UNKNOWN_ERROR = "保存できませんでした。時間をおいてもう一度お試しください。";
