"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const browserConfigured = Boolean(URL && ANON_KEY);

let client: SupabaseClient | null = null;

/** ブラウザ側でセッションの有無だけを見るためのクライアント。未設定なら null */
export function supabaseBrowser(): SupabaseClient | null {
  if (!URL || !ANON_KEY) return null;
  client ??= createBrowserClient(URL, ANON_KEY);
  return client;
}
