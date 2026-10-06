// Supabase の行（snake_case）を画面用の型に直す
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Category, Plan, Profile, Service, UserSubscription } from "./types";

type Row = Record<string, any>;

const month = (d: string | null) => (d ? d.slice(0, 7) : null);

export function tagName(row: { tags: unknown }): string | null {
  const t = row.tags as { name?: string } | { name?: string }[] | null;
  return (Array.isArray(t) ? t[0]?.name : t?.name) ?? null;
}

/** user_tags / user_subscription_tags の行を ID ごとのタグ名配列にまとめる */
export function groupTags(rows: Row[], key: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const name = tagName(row as { tags: unknown });
    if (name) map.set(row[key], [...(map.get(row[key]) ?? []), name]);
  }
  return map;
}

export const toCategory = (c: Row): Category => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  sortOrder: c.sort_order,
});

export const toService = (s: Row): Service => ({
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
});

export const toPlan = (p: Row): Plan => ({
  id: p.id,
  serviceId: p.service_id,
  name: p.name,
  price: p.price,
  billingCycle: p.billing_cycle,
  priceCheckedAt: p.price_checked_at,
});

export const toProfile = (p: Row, tags: string[]): Profile => ({
  id: p.id,
  handle: p.handle,
  displayName: p.display_name,
  avatarUrl: p.avatar_url,
  occupation: p.occupation,
  ageRange: p.age_range,
  bio: p.bio,
  visibility: p.visibility,
  tags,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

export const toSubscription = (s: Row, tags: string[]): UserSubscription => ({
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
  tags,
  updatedAt: s.updated_at,
});
