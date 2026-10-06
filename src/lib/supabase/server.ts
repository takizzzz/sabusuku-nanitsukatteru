import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Supabase の URL とキーが設定済みか。未設定ならデモ表示で動かす */
export const supabaseConfigured = Boolean(URL && ANON_KEY);

/** ログイン中のユーザーとして読み書きするクライアント（RLS が効く） */
export async function createSupabaseServer() {
  const store = await cookies();
  return createServerClient(URL!, ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Component から呼ばれたときは書けない。セッション更新は proxy が担う
        }
      },
    },
  });
}

/** RLS を通さない管理用クライアント。退会とクリック計測にだけ使う */
export function createSupabaseAdmin() {
  if (!URL || !SERVICE_ROLE_KEY) return null;
  return createClient(URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}
