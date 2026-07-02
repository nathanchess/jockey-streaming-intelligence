"use client";

import {
  Button,
  ChevronDownIcon,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@twelvelabs-io/react";
import type { DemoAsset } from "@/lib/types";
import type { LibraryValueEstimate } from "@/lib/library-value";
import { MetadataDataToggle } from "@/components/library/MetadataDataPanel";

type Props = {
  value: LibraryValueEstimate;
  assets: DemoAsset[];
  hydrated: boolean;
  dataViewOpen: boolean;
  onToggleDataView: () => void;
};

export function LibraryStatsBar({
  value,
  assets,
  hydrated,
  dataViewOpen,
  onToggleDataView,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip className="font-tl-mono text-xs">{value.assetCount} assets</Chip>
      {hydrated && (
        <>
          <Chip className="font-tl-mono text-xs">{value.totalDurationLabel} indexed</Chip>
          <div className="inline-flex items-center gap-1.5">
            <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outlined-gray"
              size="mini"
              data-testid="library-value-estimate"
              className="font-tl-mono text-xs"
            >
              ~${value.moneySavedUsd.toLocaleString()} saved
              <ChevronDownIcon className="size-3 text-foreground-subtle" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 border border-border-secondary bg-surface-white p-0 text-foreground-body shadow-lg"
          >
            <div className="border-b border-border-secondary px-4 py-3">
              <p className="text-sm font-medium">Metadata value estimate</p>
              <p className="mt-1 text-xs text-foreground-subtle">
                Compared to manual analyst watch-and-tag at 1× speed
              </p>
            </div>
            <table className="w-full text-left text-xs">
              <tbody>
                {value.rows.map((row) => (
                  <tr key={row.label} className="border-b border-border-secondary last:border-0">
                    <td className="px-4 py-2.5 align-top font-medium text-foreground-body">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 align-top font-tl-mono text-foreground-body">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 border-t border-border-secondary bg-surface-muted px-4 py-3 text-[11px] leading-relaxed text-foreground-subtle">
              {value.rows.map((row) =>
                row.detail ? (
                  <p key={`${row.label}-detail`}>
                    <span className="font-medium text-foreground-secondary">{row.label}:</span>{" "}
                    {row.detail}
                  </p>
                ) : null,
              )}
            </div>
          </PopoverContent>
        </Popover>
            <MetadataDataToggle open={dataViewOpen} onToggle={onToggleDataView} assets={assets} />
          </div>
        </>
      )}
    </div>
  );
}
