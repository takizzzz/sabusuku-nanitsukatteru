-- 運営が作成したサンプル構成の印。サンプルは画面に「運営が作成したサンプル」と出し、
-- ランキング・平均・併用率などの集計とサービスページの口コミには含めない
alter table profiles add column if not exists is_sample boolean not null default false;

-- 本人は role / status / is_sample を変えられない（管理者のみ）
create or replace function protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() and (new.role <> old.role or new.status <> old.status or new.is_sample <> old.is_sample) then
    raise exception 'role, status and is_sample can only be changed by admins';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

-- 新規登録で is_sample を付けられないようにする
drop policy if exists "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert
  with check (id = auth.uid() and role = 'user' and status = 'active' and is_sample = false);
