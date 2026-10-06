import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { seedDataset } from "@/data/seed";
import { buildIndex } from "./stacks";
import { groupTags, toCategory, toPlan, toProfile, toService, toSubscription } from "./mappers";
import type { Dataset } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const usingSeedData = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/**
 * 閲覧画面用のデータ一式を読む。Supabase が未設定ならダミーデータを返す。
 * MVP 規模（会員1万人程度）を想定して全件を読み、集計はアプリ側で行う。
 * 規模が増えたら service_stats の事前集計と SQL 側の絞り込みに移す。
 */
async function loadDataset(): Promise<Dataset> {
  if (usingSeedData) return seedDataset;

  const db = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  const [categories, services, plans, profiles, userTags, subs, subTags, likes] =
    await Promise.all([
      db.from("categories").select("*"),
      db.from("services").select("*").eq("status", "active"),
      db.from("plans").select("*"),
      db.from("profiles").select("*").neq("visibility", "private").eq("status", "active"),
      db.from("user_tags").select("user_id, tags(name)"),
      db.from("user_subscriptions").select("*").eq("is_hidden", false),
      db.from("user_subscription_tags").select("user_subscription_id, tags(name)"),
      db.from("likes").select("user_id, target_user_id"),
    ]);

  for (const r of [categories, services, plans, profiles, userTags, subs, subTags, likes]) {
    if (r.error) throw r.error;
  }

  const tagsByUser = groupTags(userTags.data!, "user_id");
  const tagsBySub = groupTags(subTags.data!, "user_subscription_id");

  return {
    categories: categories.data!.map(toCategory),
    services: services.data!.map(toService),
    plans: plans.data!.map(toPlan),
    profiles: profiles.data!.map((p) => toProfile(p, tagsByUser.get(p.id) ?? [])),
    subscriptions: subs.data!.map((s) => toSubscription(s, tagsBySub.get(s.id) ?? [])),
    likes: likes.data!.map((l) => ({ userId: l.user_id, targetUserId: l.target_user_id })),
  };
}

/** 1リクエスト内では1回だけ読む */
export const getIndex = cache(async () => buildIndex(await loadDataset()));
