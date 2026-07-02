import { getStoreSlice, loadDemoManifest } from "@/lib/manifest";
import { enrichAssetsWithJockeyV2 } from "@/lib/jockey-v2";
import { isStoreKey } from "@/lib/types";
import { notFound } from "next/navigation";
import LibraryPageClient from "@/components/library/LibraryPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ storeKey: string }>;
}) {
  const { storeKey } = await params;
  if (!isStoreKey(storeKey)) notFound();
  const manifest = loadDemoManifest();
  const slice = getStoreSlice(manifest, storeKey);
  if (!slice) notFound();
  return (
    <LibraryPageClient
      params={{ storeKey }}
      store={slice.store}
      assets={enrichAssetsWithJockeyV2(slice.assets)}
    />
  );
}
