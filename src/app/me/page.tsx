import type { Metadata } from "next";
import { DemoNotice } from "@/components/demo-notice";
import { MyStackEditor } from "@/components/me/my-stack-editor";
import { loadOwnSubscriptions, requireProfile } from "@/lib/auth";
import { buildCatalog } from "@/lib/catalog";
import { getIndex } from "@/lib/data";
import { buildStack } from "@/lib/stacks";

export const metadata: Metadata = { title: "マイ構成", robots: { index: false } };

/** S-10 マイ構成（編集） */
export default async function MePage({ searchParams }: PageProps<"/me">) {
  const viewer = await requireProfile("/me");
  const sp = await searchParams;
  const idx = await getIndex();
  const subs = await loadOwnSubscriptions(viewer);
  const stack = buildStack(idx, viewer.profile, subs);
  const catalog = buildCatalog(idx);
  const add = typeof sp.add === "string" ? (catalog.services.find((s) => s.slug === sp.add)?.id ?? null) : null;

  return (
    <>
      {viewer.demo && (
        <div className="mx-auto max-w-7xl px-margin-mobile pt-space-md sm:px-margin sm:pt-space-lg">
          <DemoNotice />
        </div>
      )}
      <MyStackEditor stack={stack} catalog={catalog} addServiceId={add} />
    </>
  );
}
