import "server-only";

import { seedDataset } from "@/data/seed";
import type { Viewer } from "./auth";
import { toCategory, toPlan, toService } from "./mappers";
import { createSupabaseServer } from "./supabase/server";
import type { Category, Plan, Service } from "./types";

export type AdminService = Service & { status: "active" | "pending" | "archived" };
export type AdminRequest = {
  id: string;
  name: string;
  url: string | null;
  categoryId: number | null;
  planName: string | null;
  price: number | null;
  currency: string | null;
  comment: string | null;
  status: "open" | "approved" | "rejected";
  createdAt: string;
  handle: string | null;
};
export type AdminReport = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  detail: string | null;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  reporter: string | null;
};
export type AdminUser = {
  id: string;
  handle: string;
  displayName: string;
  visibility: string;
  role: string;
  status: "active" | "suspended";
  createdAt: string;
};
export type AdminData = {
  categories: Category[];
  services: AdminService[];
  plans: Plan[];
  requests: AdminRequest[];
  reports: AdminReport[];
  users: AdminUser[];
  clicks: Map<string, { d30: number; d90: number }>;
};

/** 管理画面（S-16）のデータ。RLS の is_admin() で全件読める */
export async function loadAdminData(viewer: Viewer): Promise<AdminData> {
  if (viewer.demo) {
    return {
      categories: seedDataset.categories,
      services: seedDataset.services.map((s) => ({ ...s, status: "active" })),
      plans: seedDataset.plans,
      requests: [],
      reports: [],
      users: seedDataset.profiles.map((p) => ({
        id: p.id,
        handle: p.handle,
        displayName: p.displayName,
        visibility: p.visibility,
        role: p.handle === "kenji_dev" ? "admin" : "user",
        status: "active",
        createdAt: p.createdAt,
      })),
      clicks: new Map(),
    };
  }

  const db = await createSupabaseServer();
  const since = new Date(Date.now() - 90 * 864e5).toISOString();
  const [categories, services, plans, requests, reports, users, clicks] = await Promise.all([
    db.from("categories").select("*").order("sort_order"),
    db.from("services").select("*").order("name"),
    db.from("plans").select("*").order("sort_order"),
    db.from("service_requests").select("*, profiles(handle)").order("created_at", { ascending: false }).limit(200),
    db.from("reports").select("*, profiles(handle)").order("created_at", { ascending: false }).limit(200),
    db.from("profiles").select("id, handle, display_name, visibility, role, status, created_at").order("created_at", { ascending: false }).limit(500),
    db.from("affiliate_clicks").select("service_id, clicked_at").gte("clicked_at", since).limit(100000),
  ]);
  for (const r of [categories, services, plans, requests, reports, users, clicks]) if (r.error) throw r.error;

  const handleOf = (row: { profiles: unknown }) => {
    const p = row.profiles as { handle?: string } | { handle?: string }[] | null;
    return (Array.isArray(p) ? p[0]?.handle : p?.handle) ?? null;
  };
  const d30 = Date.now() - 30 * 864e5;
  const clickMap = new Map<string, { d30: number; d90: number }>();
  for (const c of clicks.data!) {
    const v = clickMap.get(c.service_id) ?? { d30: 0, d90: 0 };
    v.d90 += 1;
    if (new Date(c.clicked_at).getTime() >= d30) v.d30 += 1;
    clickMap.set(c.service_id, v);
  }

  return {
    categories: categories.data!.map(toCategory),
    services: services.data!.map((s) => ({ ...toService(s), status: s.status })),
    plans: plans.data!.map(toPlan),
    requests: requests.data!.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      categoryId: r.category_id,
      planName: r.plan_name,
      price: r.price,
      currency: r.currency,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
      handle: handleOf(r),
    })),
    reports: reports.data!.map((r) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      detail: r.detail,
      status: r.status,
      createdAt: r.created_at,
      reporter: handleOf(r),
    })),
    users: users.data!.map((u) => ({
      id: u.id,
      handle: u.handle,
      displayName: u.display_name,
      visibility: u.visibility,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
    })),
    clicks: clickMap,
  };
}
