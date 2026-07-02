"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowBoxRightIcon, Button, Chip, cn, VisionDisabledIcon } from "@twelvelabs-io/react";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { DevDrawer } from "@/components/shell/DevDrawer";
import { ClipPlayerModal } from "@/components/player/ClipPlayerModal";
import { TwelveLabsErrorModal } from "@/components/ui/TwelveLabsErrorModal";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import type { DemoManifest, StoreKey } from "@/lib/types";
import { STORE_KEYS } from "@/lib/types";

const VERTICAL_LABEL: Record<string, string> = {
  fast: "FAST",
  micro_drama: "Micro-drama",
  archive: "Archive",
};

const AVAILABLE_STORE_KEY: StoreKey = "hells_kitchen";

function StoreCard({
  storeKey,
  store,
  firstAsset,
}: {
  storeKey: StoreKey;
  store: DemoManifest["stores"][StoreKey];
  firstAsset?: DemoManifest["assets"][string];
}) {
  const isAvailable = storeKey === AVAILABLE_STORE_KEY;

  const cardBody = (
    <>
      <div className="relative aspect-[21/9] overflow-hidden bg-surface-muted">
        {firstAsset && (
          <Image
            src={firstAsset.thumbnail_url}
            alt=""
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isAvailable && "motion-safe:group-hover:scale-105",
              !isAvailable && "opacity-50 saturate-0",
            )}
            sizes="50vw"
          />
        )}
        {!isAvailable && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-white">
            <VisionDisabledIcon className="size-8" />
            <span className="text-sm font-medium tracking-wide">Coming soon</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-5">
        <div>
          <Chip variant="gray-outline" size="sm" className="mb-2">
            {VERTICAL_LABEL[store.vertical] ?? store.vertical}
          </Chip>
          <h2
            className={cn(
              "text-xl font-normal",
              !isAvailable && "text-foreground-subtle",
            )}
          >
            {store.display_name}
          </h2>
          <p className="mt-1 text-sm text-foreground-subtle">
            {isAvailable
              ? `${store.asset_ids.length} episodes indexed`
              : "Demo library in preparation"}
          </p>
        </div>
        {isAvailable ? (
          <Button variant="primary" size="sm" className="shrink-0">
            Open
            <ArrowBoxRightIcon className="size-4" />
          </Button>
        ) : (
          <Button variant="outlined-gray" size="sm" className="shrink-0" disabled>
            <VisionDisabledIcon className="size-4" />
            Coming soon
          </Button>
        )}
      </div>
    </>
  );

  if (!isAvailable) {
    return (
      <div
        data-testid={`overview-store-card-${storeKey}`}
        aria-disabled="true"
        className="block overflow-hidden rounded-2xl border border-border-secondary bg-surface-white opacity-90"
      >
        {cardBody}
      </div>
    );
  }

  return (
    <Link
      href={`/${storeKey}/library`}
      data-testid={`overview-store-card-${storeKey}`}
      className="group card-hover block overflow-hidden rounded-2xl border border-border-secondary bg-surface-white"
    >
      {cardBody}
    </Link>
  );
}

export default function OverviewClient({
  manifest,
}: {
  manifest: DemoManifest;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-[100dvh] min-h-screen items-stretch overflow-hidden">
      <AppSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      <main className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="mx-auto max-w-6xl">
          <RevealOnScroll>
            <div>
              <p className="font-tl-mono text-xs uppercase tracking-widest text-foreground-subtle">
                TWELVELABS · STREAMING INTELLIGENCE
              </p>
              <h1 className="mt-3 text-4xl font-normal tracking-tight">
                Turn messy video libraries into programmable content engines
              </h1>
              <p className="mt-4 max-w-2xl text-foreground-secondary">
                Jockey hydrates metadata, powers semantic search, personalized discovery rails,
                and FAST channel programming — pre-indexed for instant demo.
              </p>
              <p className="mt-8 text-xs text-foreground-subtle">
                Demo application — Jockey 1.0 Knowledge Stores
              </p>
            </div>
          </RevealOnScroll>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {STORE_KEYS.map((key, index) => {
              const store = manifest.stores[key];
              const firstAsset = manifest.assets[store.asset_ids[0]];
              return (
                <RevealOnScroll key={key} staggerIndex={index}>
                  <StoreCard storeKey={key} store={store} firstAsset={firstAsset} />
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </main>
      <DevDrawer />
      <ClipPlayerModal />
      <TwelveLabsErrorModal />
    </div>
  );
}
