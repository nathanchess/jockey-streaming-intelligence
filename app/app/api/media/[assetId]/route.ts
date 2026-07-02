import { createReadStream, existsSync, statSync } from "fs";
import { readFileSync } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const MANIFEST = path.join(process.cwd(), "data", "demo-manifest.json");
const VIDEO_ROOT = path.join(process.cwd(), "..", "preprocessing", "videos");

function getVideoPath(assetId: string): string | null {
  if (existsSync(MANIFEST)) {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as {
      assets: Record<string, { processing?: { local_path?: string } }>;
    };
    const asset = manifest.assets[assetId];
    if (asset?.processing?.local_path) {
      const rel = asset.processing.local_path.replace(/^videos\//, "");
      const candidate = path.join(VIDEO_ROOT, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  const fallback = path.join(VIDEO_ROOT, `${assetId}.mp4`);
  return existsSync(fallback) ? fallback : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  const filePath = getVideoPath(assetId);
  if (!filePath) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const stat = statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const stream = createReadStream(filePath, { start, end });
    return new NextResponse(stream as unknown as BodyInit, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": "video/mp4",
      },
    });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    },
  });
}
