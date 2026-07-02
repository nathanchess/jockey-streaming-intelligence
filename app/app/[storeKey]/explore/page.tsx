import { getExploreLayout } from "@/lib/explore-layout";

import { getStoreSlice, loadDemoManifest } from "@/lib/manifest";

import { loadCacheManifest } from "@/lib/jockey/load-cache";

import { isStoreKey } from "@/lib/types";

import { notFound } from "next/navigation";

import ExplorePageClient from "@/components/explore/ExplorePageClient";



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

  const cache = loadCacheManifest();

  const storeCache = cache.stores[storeKey];

  const presets =

    storeCache?.search?.presets.map((p) => ({

      id: p.id,

      label: p.label,

      query: p.query,

    })) ?? [];

  const layout = getExploreLayout(storeKey);

  return (

    <ExplorePageClient

      storeKey={storeKey}

      store={slice.store}

      presets={presets}

      layout={layout}

    />

  );

}

