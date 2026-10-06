"use server";

import { redirect } from "next/navigation";
import { getViewer } from "../auth";
import { createSupabaseAdmin, createSupabaseServer, supabaseConfigured } from "../supabase/server";
import { origin, refreshPublicPages, safeNext, text, writer, type ActionState } from "./common";

const NOT_CONNECTED = "ログイン機能は Supabase の接続後に使えるようになります。";

function authError(message: string): string {
  if (/Invalid login credentials/i.test(message)) return "メールアドレスかパスワードが違います。";
  if (/already registered/i.test(message)) return "このメールアドレスは登録済みです。ログインしてください。";
  if (/Email not confirmed/i.test(message)) return "確認メールのリンクを開いてから、もう一度ログインしてください。";
  if (/rate limit/i.test(message)) return "試行回数が多すぎます。しばらく待ってからお試しください。";
  return "うまくいきませんでした。時間をおいてもう一度お試しください。";
}

function credentials(fd: FormData): { email: string; password: string } | ActionState {
  const email = text(fd, "email");
  const password = typeof fd.get("password") === "string" ? (fd.get("password") as string) : "";
  const fields: Record<string, string> = {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fields.email = "メールアドレスを入力してください。";
  if (password.length < 8) fields.password = "パスワードは8文字以上にしてください。";
  return Object.keys(fields).length ? { fields } : { email: email!, password };
}

export async function signUp(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!supabaseConfigured) return { error: NOT_CONNECTED };
  if (fd.get("agree") !== "on") return { fields: { agree: "利用規約とプライバシーポリシーへの同意が必要です。" } };
  const c = credentials(fd);
  if (!("email" in c)) return c;
  const db = await createSupabaseServer();
  const { data, error } = await db.auth.signUp({
    email: c.email,
    password: c.password,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=/welcome` },
  });
  if (error) return { error: authError(error.message) };
  if (data.session) redirect("/welcome");
  return { ok: true, message: `${c.email} に確認メールを送りました。メール内のリンクを開くと登録が完了します。` };
}

export async function signIn(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!supabaseConfigured) return { error: NOT_CONNECTED };
  const c = credentials(fd);
  if (!("email" in c)) return c;
  const db = await createSupabaseServer();
  const { error } = await db.auth.signInWithPassword(c);
  if (error) return { error: authError(error.message) };
  redirect(safeNext(fd.get("next")));
}

export async function signInWithProvider(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!supabaseConfigured) return { error: NOT_CONNECTED };
  const provider = fd.get("provider") === "x" ? "x" : "google";
  if (fd.get("mode") === "signup" && fd.get("agree") !== "on")
    return { fields: { agree: "利用規約とプライバシーポリシーへの同意が必要です。" } };
  const next = safeNext(fd.get("next"));
  const db = await createSupabaseServer();
  const { data, error } = await db.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return { error: authError(error?.message ?? "") };
  redirect(data.url);
}

export async function requestPasswordReset(_: ActionState, fd: FormData): Promise<ActionState> {
  if (!supabaseConfigured) return { error: NOT_CONNECTED };
  const email = text(fd, "email");
  if (!email) return { fields: { email: "メールアドレスを入力してください。" } };
  const db = await createSupabaseServer();
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent("/settings?tab=account&reset=1")}`,
  });
  if (error) return { error: authError(error.message) };
  return { ok: true, message: "パスワード再設定のメールを送りました。メール内のリンクから新しいパスワードを設定してください。" };
}

export async function signOut() {
  if (supabaseConfigured) {
    const db = await createSupabaseServer();
    await db.auth.signOut();
  }
  redirect("/");
}

export async function updatePassword(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer();
  if ("error" in w) return { error: w.error };
  const password = (fd.get("password") as string | null) ?? "";
  if (password.length < 8) return { fields: { password: "パスワードは8文字以上にしてください。" } };
  if (password !== fd.get("confirm")) return { fields: { confirm: "確認用のパスワードが一致しません。" } };
  const { error } = await w.db.auth.updateUser({ password });
  if (error) return { error: authError(error.message) };
  return { ok: true, message: "パスワードを変更しました。" };
}

/** 退会（F-03）。auth.users を消すと profiles 以下は cascade で消える */
export async function deleteAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const w = await writer();
  if ("error" in w) return { error: w.error };
  const viewer = await getViewer();
  const expected = viewer?.profile?.handle ?? viewer?.email ?? "";
  if (text(fd, "confirm") !== expected) return { fields: { confirm: `確認のため「${expected}」と入力してください。` } };
  const admin = createSupabaseAdmin();
  if (!admin) return { error: "退会処理の設定が済んでいません（SUPABASE_SERVICE_ROLE_KEY が未設定）。運営にお問い合わせください。" };
  const { error } = await admin.auth.admin.deleteUser(w.viewer.userId);
  if (error) return { error: "退会できませんでした。時間をおいてもう一度お試しください。" };
  await w.db.auth.signOut();
  refreshPublicPages();
  redirect("/?bye=1");
}
