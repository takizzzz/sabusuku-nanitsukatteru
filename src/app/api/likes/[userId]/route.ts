import { NextResponse } from "next/server";
import { createSupabaseServer, supabaseConfigured } from "@/lib/supabase/server";

/** いいね数と、自分がいいね済みか。公開ページはキャッシュするのでブラウザから取りに来る */
export async function GET(_: Request, ctx: RouteContext<"/api/likes/[userId]">) {
  const { userId } = await ctx.params;
  if (!supabaseConfigured) return NextResponse.json({ count: null, liked: false });
  const db = await createSupabaseServer();
  const [{ count }, { data: auth }] = await Promise.all([
    db.from("likes").select("*", { count: "exact", head: true }).eq("target_user_id", userId),
    db.auth.getUser(),
  ]);
  let liked = false;
  if (auth.user) {
    const { data } = await db
      .from("likes")
      .select("user_id")
      .eq("user_id", auth.user.id)
      .eq("target_user_id", userId)
      .maybeSingle();
    liked = Boolean(data);
  }
  return NextResponse.json({ count, liked }, { headers: { "Cache-Control": "private, no-store" } });
}
