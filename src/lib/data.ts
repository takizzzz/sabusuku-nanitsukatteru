import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { seedDataset } from "@/data/seed";
import { buildIndex } from "./stacks";
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

  const tagName = (row: { tags: unknown }) =>
    (Array.isArray(row.tags) ? row.tags[0]?.name : (row.tags as { name?: string } | null)?.name) ?? null;

  const tagsByUser = new Map<string, string[]>();
  for (const row of userTags.data!) {
    const name = tagName(row);
    if (name) tagsByUser.set(row.user_id, [...(tagsByUser.get(row.user_id) ?? []), name]);
  }
  const tagsBySub = new Map<string, string[]>();
  for (const row of subTags.data!) {
    const name = tagName(row);
    if (name)
      tagsBySub.set(row.user_subscription_id, [
        ...(tagsBySub.get(row.user_subscription_id) ?? []),
        name,
      ]);
  }
  const month = (d: string | null) => (d ? d.slice(0, 7) : null);

  return {
    categories: categories.data!.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      sortOrder: c.sort_order,
    })),
    services: services.data!.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      company: s.company,
      categoryId: s.category_id,
      logoUrl: s.logo_url,
      brandColor: s.brand_color,
      officialUrl: s.official_url,
      affiliateUrl: s.affiliate_url,
      affiliateActive: s.affiliate_active,
    })),
    plans: plans.data!.map((p) => ({
      id: p.id,
      serviceId: p.service_id,
      name: p.name,
      price: p.price,
      billingCycle: p.billing_cycle,
      priceCheckedAt: p.price_checked_at,
    })),
    profiles: profiles.data!.map((p) => ({
      id: p.id,
      handle: p.handle,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      occupation: p.occupation,
      ageRange: p.age_range,
      bio: p.bio,
      visibility: p.visibility,
      tags: tagsByUser.get(p.id) ?? [],
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
    subscriptions: subs.data!.map((s) => ({
      id: s.id,
      userId: s.user_id,
      serviceId: s.service_id,
      planId: s.plan_id,
      monthlyPrice: s.monthly_price,
      satisfaction: s.satisfaction,
      comment: s.comment,
      startedOn: month(s.started_on),
      status: s.status,
      cancelledOn: month(s.cancelled_on),
      cancelReason: s.cancel_reason,
      cancelReasonDetail: s.cancel_reason_detail,
      switchedToServiceId: s.switched_to_service_id,
      isHidden: s.is_hidden,
      sortOrder: s.sort_order,
      tags: tagsBySub.get(s.id) ?? [],
      updatedAt: s.updated_at,
    })),
    likes: likes.data!.map((l) => ({ userId: l.user_id, targetUserId: l.target_user_id })),
  };
}

/** 1リクエスト内では1回だけ読む */
export const getIndex = cache(async () => buildIndex(await loadDataset()));
