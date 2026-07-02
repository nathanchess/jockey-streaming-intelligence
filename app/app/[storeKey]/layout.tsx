import { notFound } from "next/navigation";
import { getStoreSlice, loadDemoManifest } from "@/lib/manifest";
import { isStoreKey } from "@/lib/types";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeKey: string }>;
}) {
  const { storeKey } = await params;
  if (!isStoreKey(storeKey)) notFound();
  const manifest = loadDemoManifest();
  if (!getStoreSlice(manifest, storeKey)) notFound();
  return children;
}
