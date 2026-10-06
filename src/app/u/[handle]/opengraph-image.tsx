import { ImageResponse } from "next/og";
import { getIndex } from "@/lib/data";
import { SITE_NAME, yen } from "@/lib/format";
import { loadJapaneseFont } from "@/lib/og-font";
import { findStack } from "@/lib/stacks";

export const alt = "サブスク構成のカード";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** OGP画像：「◯◯さんのサブスク 月¥◯◯」＋ロゴ最大12個（要件定義書 10章） */
export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const stack = findStack(await getIndex(), handle);
  const name = stack?.profile.displayName ?? handle;
  const total = stack ? `¥${yen(stack.monthlyTotal)}` : "";
  const logos = (stack?.active ?? []).slice(0, 12).map((e) => e.service);
  const title = `${name} さんのサブスク`;
  const text = `${SITE_NAME}${title}月額合計${total}/月件契約中${logos.map((l) => l.name).join("")}0123456789`;
  const font = await loadJapaneseFont(text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          background: "linear-gradient(135deg, #e2dfff 0%, #faf8ff 60%)",
          color: "#131b2e",
          fontFamily: font ? "NotoJP" : undefined,
        }}
      >
        <div style={{ fontSize: 32, color: "#3525cd", fontWeight: 800 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 48, fontSize: 52, fontWeight: 800 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 800 }}>月額合計</span>
          <span style={{ fontSize: 120, fontWeight: 800, marginLeft: 24, letterSpacing: -4 }}>{total}</span>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#6b6a7b", marginLeft: 8 }}>/月</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: "auto" }}>
          {logos.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                borderRadius: 999,
                background: "#ffffff",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: 999, background: s.brandColor ?? "#4f46e5", marginRight: 10 }} />
              {s.name}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "NotoJP", data: font, weight: 800, style: "normal" }] : undefined,
    },
  );
}
