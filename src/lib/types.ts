export type Visibility = "public" | "unlisted" | "private";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled";

export type Category = {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  company: string | null;
  categoryId: number;
  logoUrl: string | null;
  brandColor: string | null;
  officialUrl: string | null;
  affiliateUrl: string | null;
  affiliateActive: boolean;
};

export type Plan = {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  priceCheckedAt: string; // YYYY-MM-DD
};

export type Profile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  occupation: string | null;
  ageRange: string | null;
  bio: string | null;
  visibility: Visibility;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type UserSubscription = {
  id: string;
  userId: string;
  serviceId: string;
  planId: string | null;
  monthlyPrice: number;
  satisfaction: number | null; // 1〜5 の整数
  comment: string | null;
  startedOn: string | null; // YYYY-MM
  status: SubscriptionStatus;
  cancelledOn: string | null; // YYYY-MM
  cancelReason: string | null;
  cancelReasonDetail: string | null;
  switchedToServiceId: string | null;
  isHidden: boolean;
  sortOrder: number;
  tags: string[];
  updatedAt: string;
};

export type Like = { userId: string; targetUserId: string };

/** 画面の集計に必要なデータ一式。データソースはこの形で返す。 */
export type Dataset = {
  categories: Category[];
  services: Service[];
  plans: Plan[];
  profiles: Profile[];
  subscriptions: UserSubscription[];
  likes: Like[];
};
