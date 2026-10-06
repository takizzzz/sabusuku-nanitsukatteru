-- 会員まわりの画面（S-08〜S-16）に必要な追加分

-- 通報の詳細（任意、500字まで）
alter table reports add column detail text check (char_length(detail) <= 500);

-- サービス追加申請の任意項目
alter table service_requests
  add column plan_name text check (char_length(plan_name) <= 50),
  add column price integer check (price >= 0),
  add column currency text check (currency in ('JPY', 'USD')),
  add column comment text check (char_length(comment) <= 300),
  add column approved_service_id uuid references services (id) on delete set null;

-- 用途タグはログインユーザーが自由に追加できる（20字まで）
create policy "create tags" on tags for insert to authenticated
  with check (char_length(name) between 1 and 20);

-- 停止中ユーザーは書き込めないようにする
create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and status = 'active');
$$;

drop policy "write own subscriptions" on user_subscriptions;
create policy "write own subscriptions" on user_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active_user());

drop policy "write own likes" on likes;
create policy "write own likes" on likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active_user());

-- 本人は role と status を変えられない（管理者のみ）
create or replace function protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (new.role <> old.role or new.status <> old.status) then
    raise exception 'role and status can only be changed by admins';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_protect before update on profiles
  for each row execute function protect_profile_columns();

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger user_subscriptions_touch before update on user_subscriptions
  for each row execute function touch_updated_at();

-- 新規登録時の profiles は role/status を既定値以外にできない
drop policy "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert
  with check (id = auth.uid() and role = 'user' and status = 'active');

-- アイコン画像（公開読み取り、本人のフォルダにだけ書ける）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "write own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 管理者は通報対応で契約行を非表示にできる
create policy "admin subscriptions" on user_subscriptions for update using (is_admin()) with check (is_admin());
