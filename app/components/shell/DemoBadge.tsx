import { Chip, cn } from "@twelvelabs-io/react";

export function DemoBadge({ collapsed }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="mb-2 flex justify-center" title="Demo application">
        <span className="size-1.5 rounded-full bg-foreground-subtle/50" />
      </div>
    );
  }
  return (
    <Chip className="mb-3 w-full justify-center border border-border-secondary bg-surface-body font-tl-mono text-[10px] uppercase tracking-wider text-foreground-subtle">
      Demo App
    </Chip>
  );
}
