import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/coming-soon";
import { getIndex } from "@/lib/data";

export const metadata = { robots: { index: false } };

export default async function Page({ params }: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = (await getIndex()).ds.services.find((s) => s.slug === slug);
  if (!service) notFound();
  return <ComingSoon title={service.name}>サービス詳細ページは準備中です。</ComingSoon>;
}
