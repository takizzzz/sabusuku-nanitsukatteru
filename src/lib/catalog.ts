// 入力画面（S-09, S-11）にクライアントへ渡すサービス一覧
import { popularTags, serviceStats, serviceTopTags, type Index } from "./stacks";
import type { Category, Plan, Service } from "./types";

export type CatalogService = Pick<Service, "id" | "slug" | "name" | "company" | "categoryId" | "brandColor" | "logoUrl"> & {
  users: number;
  tags: string[];
};
export type CatalogPlan = Pick<Plan, "id" | "serviceId" | "name" | "price" | "billingCycle">;
export type Catalog = {
  services: CatalogService[]; // 利用者が多い順
  plans: CatalogPlan[];
  categories: Category[];
  popularTags: string[];
};

export function buildCatalog(idx: Index): Catalog {
  const tags = serviceTopTags(idx);
  return {
    services: serviceStats(idx)
      .map(({ service: s, activeUsers: users }) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        company: s.company,
        categoryId: s.categoryId,
        brandColor: s.brandColor,
        logoUrl: s.logoUrl,
        users,
        tags: tags[s.id] ?? [],
      }))
      .sort((a, b) => b.users - a.users || a.name.localeCompare(b.name)),
    plans: idx.ds.plans.map(({ id, serviceId, name, price, billingCycle }) => ({ id, serviceId, name, price, billingCycle })),
    categories: [...idx.ds.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    popularTags: popularTags(idx, 16),
  };
}

/** 年額プランは12で割った月額にする */
export function monthlyOfPlan(plan: Pick<Plan, "price" | "billingCycle">): number {
  return plan.billingCycle === "yearly" ? Math.round(plan.price / 12) : plan.price;
}

/** 検索用の正規化（大文字小文字・全角半角・空白を無視） */
export function normalize(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}
