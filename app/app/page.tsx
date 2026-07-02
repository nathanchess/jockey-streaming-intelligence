import { loadDemoManifest } from "@/lib/manifest";
import OverviewClient from "@/components/overview/OverviewClient";

export default function Page() {
  const manifest = loadDemoManifest();
  return <OverviewClient manifest={manifest} />;
}
