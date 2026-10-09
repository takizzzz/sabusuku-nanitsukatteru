-- Supabase Security Advisor の警告対応
-- touch_updated_at: search_path を固定する
alter function public.touch_updated_at() set search_path = public;
-- protect_profile_columns はトリガー専用。RPC から呼べないようにする
revoke execute on function public.protect_profile_columns() from public, anon, authenticated;
