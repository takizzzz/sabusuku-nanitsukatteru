import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/format";
import { createSupabaseServer, supabaseConfigured } from "@/lib/supabase/server";

/** メール確認・OAuth・パスワード再設定から戻ってくる先 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  let next = safeNextPath(url.searchParams.get("next") ?? undefined);
  if (!supabaseConfigured || !code) return NextResponse.redirect(new URL("/login?error=callback", url));

  const db = await createSupabaseServer();
  const { data, error } = await db.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/login?error=callback", url));

  // プロフィール未作成なら、まずオンボーディングへ
  if (!next.startsWith("/settings")) {
    const { data: profile } = await db.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (!profile) next = "/welcome";
  }
  return NextResponse.redirect(new URL(next, url));
}
