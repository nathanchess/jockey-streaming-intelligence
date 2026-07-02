import { getStoreSlice, loadDemoManifest } from "@/lib/manifest";
import { isStoreKey } from "@/lib/types";
import { notFound } from "next/navigation";
import ProgramPageClient from "@/components/program/ProgramPageClient";

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
  return <ProgramPageClient storeKey={storeKey} store={slice.store} />;
}
