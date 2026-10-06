import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { seedDataset } from "@/data/seed";
import { toProfile, toSubscription } from "./mappers";
import { createSupabaseServer, supabaseConfigured } from "./supabase/server";
import type { Profile, UserSubscription } from "./types";

export type AccountProfile = Profile & { role: "user" | "admin"; status: "active" | "suspended" };

export type Viewer = {
  userId: string;
  email: string | null;
  profile: AccountProfile | null;
  /** Supabase 未接続のデモ表示。保存はできない */
  demo: boolean;
};

export const DEMO_MESSAGE = "デモ表示のため保存できません（Supabase の接続後に使えるようになります）。";

const DEMO_HANDLE = "kenji_dev";

function demoViewer(): Viewer {
  const p = seedDataset.profiles.find((x) => x.handle === DEMO_HANDLE)!;
  return { userId: p.id, email: "demo@example.com", profile: { ...p, role: "admin", status: "active" }, demo: true };
}

/** ログイン中のユーザー。未ログインなら null。Supabase 未接続ならデモユーザー */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!supabaseConfigured) return demoViewer();
  const db = await createSupabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: row } = await db
    .from("profiles")
    .select("*, user_tags(tags(name))")
    .eq("id", user.id)
    .maybeSingle();
  const tags = row ? tagList(row.user_tags) : [];
  return {
    userId: user.id,
    email: user.email ?? null,
    profile: row ? { ...toProfile(row, tags), role: row.role, status: row.status } : null,
    demo: false,
  };
});

function tagList(rows: { tags: { name: string } | null }[] | null): string[] {
  return (rows ?? []).map((r) => r.tags?.name).filter((n): n is string => Boolean(n));
}

/** ログイン必須の画面で使う。未ログインならログイン画面へ */
export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

/** プロフィール作成済みが必要な画面で使う。未作成ならオンボーディングへ */
export async function requireProfile(next: string): Promise<Viewer & { profile: AccountProfile }> {
  const viewer = await requireViewer(next);
  if (!viewer.profile) redirect("/welcome");
  return viewer as Viewer & { profile: AccountProfile };
}

/** 自分の契約一覧（非表示にしたものも含む） */
export async function loadOwnSubscriptions(viewer: Viewer): Promise<UserSubscription[]> {
  if (viewer.demo) return seedDataset.subscriptions.filter((s) => s.userId === viewer.userId);
  const db = await createSupabaseServer();
  const { data, error } = await db
    .from("user_subscriptions")
    .select("*, user_subscription_tags(tags(name))")
    .eq("user_id", viewer.userId)
    .order("sort_order");
  if (error) throw error;
  return data.map((s) => toSubscription(s, tagList(s.user_subscription_tags)));
}
