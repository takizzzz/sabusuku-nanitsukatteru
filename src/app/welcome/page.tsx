import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupWizard } from "@/components/welcome/setup-wizard";
import { requireViewer } from "@/lib/auth";
import { buildCatalog } from "@/lib/catalog";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = { title: "構成のセットアップ", robots: { index: false } };

/** S-09 オンボーディング */
export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const sp = await searchParams;
  const service = typeof sp.service === "string" ? sp.service : null;
  const viewer = await requireViewer(service ? `/welcome?service=${service}` : "/welcome");
  // 登録済みの人はマイ構成で追加する
  if (viewer.profile && !viewer.demo) redirect(service ? `/me?add=${encodeURIComponent(service)}` : "/me");

  const catalog = buildCatalog(await getIndex());
  const local = (viewer.email ?? "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
  return (
    <SetupWizard
      catalog={catalog}
      initial={{ displayName: viewer.demo ? "" : local, handle: viewer.demo ? "" : local.length >= 3 ? local : "" }}
      preselect={service}
      demo={viewer.demo}
    />
  );
}
