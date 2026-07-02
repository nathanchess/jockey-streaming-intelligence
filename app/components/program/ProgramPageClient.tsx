"use client";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { StoreShell } from "@/components/shell/StoreShell";
import { ProgramPanel } from "@/components/program/ProgramPanel";
import type { DemoStore, StoreKey } from "@/lib/types";
import { isStoreKey } from "@/lib/types";

export default function ProgramPageClient({
  storeKey,
  store,
}: {
  storeKey: StoreKey;
  store: DemoStore;
}) {
  if (!isStoreKey(storeKey)) notFound();

  return (
    <StoreShell storeKey={storeKey}>
      <PageHeader
        title="Program"
        subtitle="FAST channel lineup generation from a natural-language brief."
      />
      <ProgramPanel storeKey={storeKey} storeDisplayName={store.display_name} />
    </StoreShell>
  );
}
