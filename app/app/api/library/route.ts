import { NextResponse } from "next/server";
import { loadDemoManifest } from "@/lib/manifest";

export async function GET() {
  try {
    const manifest = loadDemoManifest();
    return NextResponse.json(manifest);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load manifest" },
      { status: 500 },
    );
  }
}
