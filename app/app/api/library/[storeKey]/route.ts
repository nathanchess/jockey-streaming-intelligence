import { NextResponse } from "next/server";
import { loadDemoManifest, getStoreSlice } from "@/lib/manifest";
import { isStoreKey } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeKey: string }> },
) {
  const { storeKey } = await params;
  if (!isStoreKey(storeKey)) {
    return NextResponse.json({ error: "Unknown store" }, { status: 404 });
  }
  try {
    const manifest = loadDemoManifest();
    const slice = getStoreSlice(manifest, storeKey);
    if (!slice) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    return NextResponse.json({ store: slice.store, assets: slice.assets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
