import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIndex } from "@/lib/data";

/**
 * 公式サイトへのリダイレクト。アフィリエイトが有効ならアフィリエイトURLへ飛ばし、
 * クリックを affiliate_clicks に記録する（要件定義書 F-22）。
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idx = await getIndex();
  const service = idx.ds.services.find((s) => s.slug === slug);
  if (!service) return new NextResponse("Not found", { status: 404 });

  const target =
    service.affiliateActive && service.affiliateUrl ? service.affiliateUrl : service.officialUrl;
  if (!target) return new NextResponse("Not found", { status: 404 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const from = new URL(request.url).searchParams.get("from")?.slice(0, 100) ?? null;
    const db = createClient(url, key, { auth: { persistSession: false } });
    // 計測の失敗でユーザーの遷移を止めない
    await db
      .from("affiliate_clicks")
      .insert({ service_id: service.id, source_page: from })
      .then(({ error }) => error && console.error("affiliate click", error.message));
  }

  return NextResponse.redirect(target, 302);
}
