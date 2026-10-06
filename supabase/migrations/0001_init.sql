-- さぶすくなにつかってる！？ 初期スキーマ（要件定義書 7章）
-- users は Supabase Auth の auth.users と 1:1 の profiles として持つ。

create extension if not exists "pgcrypto";

create type visibility as enum ('public', 'unlisted', 'private');
create type user_role as enum ('user', 'admin');
create type user_status as enum ('active', 'suspended');
create type service_status as enum ('active', 'pending', 'archived');
create type billing_cycle as enum ('monthly', 'yearly');
create type subscription_status as enum ('active', 'cancelled');
create type report_status as enum ('open', 'resolved', 'dismissed');
create type request_status as enum ('open', 'approved', 'rejected');

create table categories (
  id smallserial primary key,
  slug text not null unique,
  name text not null,
  sort_order smallint not null default 0
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null,
  avatar_url text,
  occupation text,
  age_range text,
  bio text check (char_length(bio) <= 300),
  visibility visibility not null default 'public',
  role user_role not null default 'user',
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  company text,
  category_id smallint not null references categories (id),
  logo_url text,
  brand_color text,
  official_url text,
  affiliate_url text,
  affiliate_active boolean not null default false,
  status service_status not null default 'active',
  created_at timestamptz not null default now()
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services (id) on delete cascade,
  name text not null,
  price integer not null check (price >= 0),
  billing_cycle billing_cycle not null default 'monthly',
  price_checked_at date not null,
  sort_order smallint not null default 0
);

create table tags (
  id smallserial primary key,
  name text not null unique,
  type text not null default 'purpose'
);

create table user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  service_id uuid not null references services (id),
  plan_id uuid references plans (id) on delete set null,
  monthly_price integer not null check (monthly_price >= 0),
  satisfaction smallint check (satisfaction between 1 and 5),
  comment text check (char_length(comment) <= 200),
  started_on date,
  status subscription_status not null default 'active',
  cancelled_on date,
  cancel_reason text,
  cancel_reason_detail text check (char_length(cancel_reason_detail) <= 200),
  switched_to_service_id uuid references services (id),
  is_hidden boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_subscriptions_user_idx on user_subscriptions (user_id);
create index user_subscriptions_service_idx on user_subscriptions (service_id);

create table user_subscription_tags (
  user_subscription_id uuid not null references user_subscriptions (id) on delete cascade,
  tag_id smallint not null references tags (id),
  primary key (user_subscription_id, tag_id)
);

create table user_tags (
  user_id uuid not null references profiles (id) on delete cascade,
  tag_id smallint not null references tags (id),
  primary key (user_id, tag_id)
);

create table likes (
  user_id uuid not null references profiles (id) on delete cascade,
  target_user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_user_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete set null,
  name text not null,
  url text,
  category_id smallint references categories (id),
  status request_status not null default 'open',
  created_at timestamptz not null default now()
);

create table affiliate_clicks (
  id bigserial primary key,
  service_id uuid not null references services (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  source_page text,
  clicked_at timestamptz not null default now()
);

create table service_stats (
  service_id uuid primary key references services (id) on delete cascade,
  active_users integer not null default 0,
  avg_satisfaction numeric(3, 2),
  cancel_count integer not null default 0,
  co_usage jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table categories enable row level security;
alter table profiles enable row level security;
alter table services enable row level security;
alter table plans enable row level security;
alter table tags enable row level security;
alter table user_subscriptions enable row level security;
alter table user_subscription_tags enable row level security;
alter table user_tags enable row level security;
alter table likes enable row level security;
alter table reports enable row level security;
alter table service_requests enable row level security;
alter table affiliate_clicks enable row level security;
alter table service_stats enable row level security;

-- マスタ類は誰でも読める
create policy "read categories" on categories for select using (true);
create policy "read active services" on services for select using (status = 'active' or is_admin());
create policy "read plans" on plans for select using (true);
create policy "read tags" on tags for select using (true);
create policy "read service_stats" on service_stats for select using (true);
create policy "admin services" on services for all using (is_admin()) with check (is_admin());
create policy "admin plans" on plans for all using (is_admin()) with check (is_admin());
create policy "admin categories" on categories for all using (is_admin()) with check (is_admin());

-- プロフィール：private 以外は誰でも読める。本人は自分のものを読み書きできる
create policy "read visible profiles" on profiles for select
  using ((visibility <> 'private' and status = 'active') or id = auth.uid() or is_admin());
create policy "insert own profile" on profiles for insert with check (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid() or is_admin());

-- 契約：公開プロフィールの非表示でないものは誰でも読める
create policy "read visible subscriptions" on user_subscriptions for select using (
  user_id = auth.uid() or is_admin() or (
    not is_hidden and exists (
      select 1 from profiles p
      where p.id = user_id and p.visibility <> 'private' and p.status = 'active'
    )
  )
);
create policy "write own subscriptions" on user_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read subscription tags" on user_subscription_tags for select using (
  exists (select 1 from user_subscriptions s where s.id = user_subscription_id)
);
create policy "write own subscription tags" on user_subscription_tags for all using (
  exists (select 1 from user_subscriptions s where s.id = user_subscription_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from user_subscriptions s where s.id = user_subscription_id and s.user_id = auth.uid())
);

create policy "read user tags" on user_tags for select using (true);
create policy "write own user tags" on user_tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read likes" on likes for select using (true);
create policy "write own likes" on likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "create report" on reports for insert with check (reporter_id = auth.uid());
create policy "admin reports" on reports for all using (is_admin()) with check (is_admin());

create policy "create service request" on service_requests for insert with check (user_id = auth.uid());
create policy "read own service request" on service_requests for select using (user_id = auth.uid() or is_admin());
create policy "admin service requests" on service_requests for update using (is_admin());

-- クリック計測はサーバー（service role）からのみ書き込む。読むのは管理者だけ
create policy "admin affiliate clicks" on affiliate_clicks for select using (is_admin());
