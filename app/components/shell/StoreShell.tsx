"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { DevDrawer } from "@/components/shell/DevDrawer";
import { ClipPlayerModal } from "@/components/player/ClipPlayerModal";
import { TwelveLabsErrorModal } from "@/components/ui/TwelveLabsErrorModal";
import { isStoreKey, type StoreKey } from "@/lib/types";

export function StoreShell({
  storeKey,
  children,
}: {
  storeKey: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (!isStoreKey(storeKey)) notFound();

  return (
    <div className="flex h-[100dvh] min-h-screen items-stretch overflow-hidden">
      <AppSidebar
        storeKey={storeKey as StoreKey}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <main id="store-main" className="relative flex-1 overflow-y-auto p-8 md:p-10">
        <div className="page-enter">{children}</div>
      </main>
      <DevDrawer />
      <ClipPlayerModal />
      <TwelveLabsErrorModal />
    </div>
  );
}
