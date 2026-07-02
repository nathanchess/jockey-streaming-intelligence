"use client";

import { TwelveLabsErrorPage } from "@/components/ui/TwelveLabsErrorPage";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <TwelveLabsErrorPage reset={reset} />;
}
