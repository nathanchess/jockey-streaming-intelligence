"use client";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { StoreShell } from "@/components/shell/StoreShell";
import { ExplorePanel } from "@/components/explore/ExplorePanel";
import type { ExploreLayout } from "@/lib/explore-layout";
import type { DemoStore, StoreKey } from "@/lib/types";
import { isStoreKey } from "@/lib/types";

export default function ExplorePageClient({
  storeKey,
  store,
  presets,
  layout,
}: {
  storeKey: StoreKey;
  store: DemoStore;
  presets: Array<{ id: string; label: string; query: string }>;
  layout: ExploreLayout;
}) {
  if (!isStoreKey(storeKey)) notFound();

  return (
    <StoreShell storeKey={storeKey}>
      <PageHeader
        title="Explore"
        subtitle={`Search moments across ${store.display_name}`}
      />
      <ExplorePanel
        storeKey={storeKey}
        presets={presets}
        layout={layout}
        storeDisplayName={store.display_name}
      />
    </StoreShell>
  );
}
