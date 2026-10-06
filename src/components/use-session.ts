"use client";

import { useEffect, useState } from "react";
import { browserConfigured, supabaseBrowser } from "@/lib/supabase/browser";

/**
 * ブラウザ側でログイン中のユーザーIDを得る。公開ページはキャッシュするので、
 * 本人向けの表示（編集ボタンなど）はここで後から出す。undefined は確認中。
 */
export function useSessionUserId(): string | null | undefined {
  const [id, setId] = useState<string | null | undefined>(browserConfigured ? undefined : null);
  useEffect(() => {
    const db = supabaseBrowser();
    if (!db) return;
    db.auth.getSession().then(({ data }) => setId(data.session?.user.id ?? null));
    const { data } = db.auth.onAuthStateChange((_e, session) => setId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return id;
}
