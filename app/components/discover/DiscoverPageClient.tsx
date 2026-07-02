"use client";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { StoreShell } from "@/components/shell/StoreShell";
import { DiscoverPanel } from "@/components/discover/DiscoverPanel";
import type { DemoStore, StoreKey } from "@/lib/types";
import type { StoreCharacterOption } from "@/lib/store-characters";
import { isStoreKey } from "@/lib/types";

export default function DiscoverPageClient({
  storeKey,
  store,
  storeCharacters,
}: {
  storeKey: StoreKey;
  store: DemoStore;
  storeCharacters: StoreCharacterOption[];
}) {
  if (!isStoreKey(storeKey)) notFound();

  return (
    <StoreShell storeKey={storeKey}>
      <PageHeader
        title="Personalization"
        subtitle="Personalized content rails from viewer intent."
      />
      <DiscoverPanel
        storeKey={storeKey}
        storeDisplayName={store.display_name}
        storeCharacters={storeCharacters}
      />
    </StoreShell>
  );
}
