// Dataset から画面用の値を組み立てる純粋関数。集計ルールは要件定義書 7章に従う。
//  - 統計には public と unlisted を含め、private と is_hidden は除外する
//  - 一覧（探す・トップ）に出すのは public のみ
//  - 月額合計は active の monthly_price の合計

import type {
  Category,
  Dataset,
  Plan,
  Profile,
  Service,
  UserSubscription,
} from "./types";

export const MIN_USERS_FOR_STATS = 5;

export type StackEntry = {
  sub: UserSubscription;
  service: Service;
  plan: Plan | null;
  switchedTo: Service | null;
};

export type CategoryShare = {
  category: Category;
  amount: number;
  ratio: number;
};

export type Stack = {
  profile: Profile;
  monthlyTotal: number;
  active: StackEntry[];
  cancelled: StackEntry[];
  categoryShares: CategoryShare[];
  likeCount: number;
};

export type Index = ReturnType<typeof buildIndex>;

export function buildIndex(ds: Dataset) {
  const services = new Map(ds.services.map((s) => [s.id, s]));
  const plans = new Map(ds.plans.map((p) => [p.id, p]));
  const categories = new Map(ds.categories.map((c) => [c.id, c]));
  const subsByUser = new Map<string, UserSubscription[]>();
  for (const sub of ds.subscriptions) {
    if (sub.isHidden) continue;
    const list = subsByUser.get(sub.userId) ?? [];
    list.push(sub);
    subsByUser.set(sub.userId, list);
  }
  const likeCount = new Map<string, number>();
  for (const like of ds.likes) {
    likeCount.set(like.targetUserId, (likeCount.get(like.targetUserId) ?? 0) + 1);
  }
  return { ds, services, plans, categories, subsByUser, likeCount };
}

function toEntry(idx: Index, sub: UserSubscription): StackEntry | null {
  const service = idx.services.get(sub.serviceId);
  if (!service) return null;
  return {
    sub,
    service,
    plan: sub.planId ? (idx.plans.get(sub.planId) ?? null) : null,
    switchedTo: sub.switchedToServiceId
      ? (idx.services.get(sub.switchedToServiceId) ?? null)
      : null,
  };
}

export function buildStack(idx: Index, profile: Profile): Stack {
  const subs = [...(idx.subsByUser.get(profile.id) ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const entries = subs.map((s) => toEntry(idx, s)).filter((e) => e !== null);
  const active = entries.filter((e) => e.sub.status === "active");
  const cancelled = entries.filter((e) => e.sub.status === "cancelled");
  const monthlyTotal = active.reduce((sum, e) => sum + e.sub.monthlyPrice, 0);

  const byCategory = new Map<number, number>();
  for (const e of active) {
    byCategory.set(
      e.service.categoryId,
      (byCategory.get(e.service.categoryId) ?? 0) + e.sub.monthlyPrice,
    );
  }
  const categoryShares = [...byCategory.entries()]
    .map(([id, amount]) => ({
      category: idx.categories.get(id)!,
      amount,
      ratio: monthlyTotal > 0 ? amount / monthlyTotal : 0,
    }))
    .filter((c) => c.category)
    .sort((a, b) => b.amount - a.amount);

  return {
    profile,
    monthlyTotal,
    active,
    cancelled,
    categoryShares,
    likeCount: idx.likeCount.get(profile.id) ?? 0,
  };
}

/** 統計対象（public＋unlisted）のプロフィール */
export function statProfiles(idx: Index): Profile[] {
  return idx.ds.profiles.filter((p) => p.visibility !== "private");
}

/** 一覧に出せるプロフィール（public のみ） */
export function listableProfiles(idx: Index): Profile[] {
  return idx.ds.profiles.filter((p) => p.visibility === "public");
}

export function findStack(idx: Index, handle: string): Stack | null {
  const profile = idx.ds.profiles.find(
    (p) => p.handle === handle && p.visibility !== "private",
  );
  return profile ? buildStack(idx, profile) : null;
}

// ---------------------------------------------------------------
// 構成の検索（S-02）
// ---------------------------------------------------------------

export const BUDGET_BANDS = [
  { id: "lte3000", label: "〜3,000円", min: 0, max: 3000 },
  { id: "lte5000", label: "3,001〜5,000円", min: 3001, max: 5000 },
  { id: "lte10000", label: "5,001〜10,000円", min: 5001, max: 10000 },
  { id: "lte20000", label: "10,001〜20,000円", min: 10001, max: 20000 },
  { id: "gt20000", label: "20,001円〜", min: 20001, max: Infinity },
] as const;

export const AGE_GROUPS = ["10代", "20代", "30代", "40代", "50代以上"] as const;

export const SORTS = [
  { id: "popular", label: "人気順" },
  { id: "new", label: "新着順" },
  { id: "cheap", label: "月額が安い順" },
  { id: "expensive", label: "月額が高い順" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

export type StackFilter = {
  q?: string;
  occupation?: string[];
  age?: string[];
  budget?: string;
  services?: string[]; // service slug（すべて含む）
  tags?: string[];
  sort?: SortId;
};

export function searchStacks(idx: Index, f: StackFilter): Stack[] {
  const band = BUDGET_BANDS.find((b) => b.id === f.budget);
  const q = f.q?.trim().toLowerCase();
  const stacks = listableProfiles(idx)
    .filter((p) => !f.occupation?.length || f.occupation.includes(p.occupation ?? ""))
    .filter(
      (p) => !f.age?.length || f.age.some((a) => (p.ageRange ?? "").startsWith(a.replace("以上", ""))),
    )
    .map((p) => buildStack(idx, p))
    .filter((s) => s.active.length > 0)
    .filter((s) => !band || (s.monthlyTotal >= band.min && s.monthlyTotal <= band.max))
    .filter((s) => {
      if (!f.services?.length) return true;
      const slugs = new Set(s.active.map((e) => e.service.slug));
      return f.services.every((slug) => slugs.has(slug));
    })
    .filter((s) => {
      if (!f.tags?.length) return true;
      const tags = new Set([...s.profile.tags, ...s.active.flatMap((e) => e.sub.tags)]);
      return f.tags.some((t) => tags.has(t));
    })
    .filter((s) => {
      if (!q) return true;
      const hay = [
        s.profile.handle,
        s.profile.displayName,
        s.profile.occupation,
        s.profile.bio,
        ...s.active.map((e) => e.service.name),
        ...s.active.map((e) => e.sub.comment),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

  const sort = f.sort ?? "popular";
  const by: Record<SortId, (a: Stack, b: Stack) => number> = {
    popular: (a, b) => b.likeCount - a.likeCount,
    new: (a, b) => b.profile.updatedAt.localeCompare(a.profile.updatedAt),
    cheap: (a, b) => a.monthlyTotal - b.monthlyTotal,
    expensive: (a, b) => b.monthlyTotal - a.monthlyTotal,
  };
  return stacks.sort(by[sort]);
}

/** 似た構成：契約中サービスの重なり（Jaccard）が大きい順 */
export function similarStacks(idx: Index, base: Stack, n = 3): Stack[] {
  const mine = new Set(base.active.map((e) => e.service.id));
  return listableProfiles(idx)
    .filter((p) => p.id !== base.profile.id)
    .map((p) => buildStack(idx, p))
    .map((s) => {
      const theirs = new Set(s.active.map((e) => e.service.id));
      const inter = [...mine].filter((id) => theirs.has(id)).length;
      const union = new Set([...mine, ...theirs]).size;
      return { s, score: union ? inter / union : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.s.likeCount - a.s.likeCount)
    .slice(0, n)
    .map((x) => x.s);
}

// ---------------------------------------------------------------
// サービス統計・ランキング・全体統計（S-01, S-07）
// ---------------------------------------------------------------

export type ServiceStat = {
  service: Service;
  category: Category;
  activeUsers: number;
  usageRate: number; // 構成数に対する利用率
  avgSatisfaction: number | null; // 利用者が少なければ null（データ不足）
  cancelCount: number;
  representativePlan: Plan | null;
};

export function serviceStats(idx: Index): ServiceStat[] {
  const profiles = statProfiles(idx);
  const ids = new Set(profiles.map((p) => p.id));
  const stackCount = profiles.filter((p) =>
    (idx.subsByUser.get(p.id) ?? []).some((s) => s.status === "active"),
  ).length;

  const acc = new Map<string, { users: number; satSum: number; satN: number; cancels: number }>();
  for (const [userId, subs] of idx.subsByUser) {
    if (!ids.has(userId)) continue;
    for (const sub of subs) {
      const a = acc.get(sub.serviceId) ?? { users: 0, satSum: 0, satN: 0, cancels: 0 };
      if (sub.status === "active") {
        a.users += 1;
        if (sub.satisfaction) {
          a.satSum += sub.satisfaction;
          a.satN += 1;
        }
      } else {
        a.cancels += 1;
      }
      acc.set(sub.serviceId, a);
    }
  }

  return idx.ds.services.map((service) => {
    const a = acc.get(service.id) ?? { users: 0, satSum: 0, satN: 0, cancels: 0 };
    const plan =
      idx.ds.plans.find((p) => p.serviceId === service.id && p.billingCycle === "monthly") ??
      idx.ds.plans.find((p) => p.serviceId === service.id) ??
      null;
    return {
      service,
      category: idx.categories.get(service.categoryId)!,
      activeUsers: a.users,
      usageRate: stackCount ? a.users / stackCount : 0,
      avgSatisfaction:
        a.users >= MIN_USERS_FOR_STATS && a.satN ? a.satSum / a.satN : null,
      cancelCount: a.cancels,
      representativePlan: plan,
    };
  });
}

export type RankingKind = "users" | "satisfaction" | "cancels";

export function ranking(
  idx: Index,
  kind: RankingKind,
  opts: { categorySlug?: string; limit?: number } = {},
): ServiceStat[] {
  const stats = serviceStats(idx).filter(
    (s) => !opts.categorySlug || s.category.slug === opts.categorySlug,
  );
  const sorted =
    kind === "users"
      ? stats.filter((s) => s.activeUsers > 0).sort((a, b) => b.activeUsers - a.activeUsers)
      : kind === "satisfaction"
        ? stats
            .filter((s) => s.avgSatisfaction !== null)
            .sort((a, b) => b.avgSatisfaction! - a.avgSatisfaction! || b.activeUsers - a.activeUsers)
        : stats.filter((s) => s.cancelCount > 0).sort((a, b) => b.cancelCount - a.cancelCount);
  return sorted.slice(0, opts.limit ?? 20);
}

export type SiteStats = {
  stackCount: number;
  avgMonthly: number;
  medianMonthly: number;
  topService: ServiceStat | null;
  cancelCount: number;
};

export function siteStats(idx: Index): SiteStats {
  const stacks = statProfiles(idx)
    .map((p) => buildStack(idx, p))
    .filter((s) => s.active.length > 0);
  const totals = stacks.map((s) => s.monthlyTotal).sort((a, b) => a - b);
  const mid = Math.floor(totals.length / 2);
  const median = totals.length
    ? totals.length % 2
      ? totals[mid]
      : Math.round((totals[mid - 1] + totals[mid]) / 2)
    : 0;
  const top = ranking(idx, "users", { limit: 1 })[0] ?? null;
  return {
    stackCount: stacks.length,
    avgMonthly: totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0,
    medianMonthly: median,
    topService: top,
    cancelCount: stacks.reduce((n, s) => n + s.cancelled.length, 0),
  };
}

/** 構成内・プロフィールに出てくる用途タグ（多い順） */
export function popularTags(idx: Index, n = 12): string[] {
  const count = new Map<string, number>();
  for (const p of listableProfiles(idx)) {
    for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1);
    for (const s of idx.subsByUser.get(p.id) ?? []) {
      for (const t of s.tags) count.set(t, (count.get(t) ?? 0) + 1);
    }
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);
}

/** 職種ごとの公開構成数 */
export function occupationCounts(idx: Index): { occupation: string; count: number }[] {
  const count = new Map<string, number>();
  for (const p of listableProfiles(idx)) {
    if (!p.occupation) continue;
    count.set(p.occupation, (count.get(p.occupation) ?? 0) + 1);
  }
  return [...count.entries()]
    .map(([occupation, c]) => ({ occupation, count: c }))
    .sort((a, b) => b.count - a.count);
}
