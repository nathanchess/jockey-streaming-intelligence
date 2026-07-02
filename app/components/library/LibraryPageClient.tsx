"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { StoreShell } from "@/components/shell/StoreShell";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import type { DemoAsset, DemoStore } from "@/lib/types";
import { isStoreKey } from "@/lib/types";

export default function LibraryPage({
  params,
  store,
  assets,
}: {
  params: { storeKey: string };
  store: DemoStore;
  assets: DemoAsset[];
}) {
  const { storeKey } = params;
  const [hydrated, setHydrated] = useState(false);
  if (!isStoreKey(storeKey)) notFound();

  return (
    <StoreShell storeKey={storeKey}>
      <PageHeader
        title="Library"
        subtitle="Compare thin catalog metadata with Jockey-hydrated records."
      />
      <LibraryGrid assets={assets} hydrated={hydrated} onHydratedChange={setHydrated} />
    </StoreShell>
  );
}
