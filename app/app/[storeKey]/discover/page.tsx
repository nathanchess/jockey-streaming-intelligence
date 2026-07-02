import { getStoreSlice, loadDemoManifest } from "@/lib/manifest";
import { enrichAssetsWithJockeyV2 } from "@/lib/jockey-v2";
import { collectStoreCharacters } from "@/lib/store-characters";
import { isStoreKey } from "@/lib/types";
import { notFound } from "next/navigation";
import DiscoverPageClient from "@/components/discover/DiscoverPageClient";

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
  const assets = enrichAssetsWithJockeyV2(slice.assets);
  const storeCharacters = collectStoreCharacters(assets);
  return (
    <DiscoverPageClient
      storeKey={storeKey}
      store={slice.store}
      storeCharacters={storeCharacters}
    />
  );
}
