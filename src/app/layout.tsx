import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Plus_Jakarta_Sans } from "next/font/google";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE_NAME, SITE_URL } from "@/lib/format";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  weight: ["400", "500", "700", "800"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} みんなのサブスク構成と使い分け`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "生成AIから動画・音楽まで。みんなが契約しているサブスクと「どう使い分けているか」、リアルな月額がわかる共有サービス。",
};

export const viewport: Viewport = {
  themeColor: "#faf8ff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${jakarta.variable} ${notoJp.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <BottomTabBar />
      </body>
    </html>
  );
}
