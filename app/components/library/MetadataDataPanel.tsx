"use client";

import { useMemo } from "react";
import { Button, DownloadIcon, GridIcon, IconButton, cn } from "@twelvelabs-io/react";
import type { DemoAsset } from "@/lib/types";
import {
  buildEpisodeMetadataRows,
  downloadMetadataJson,
} from "@/lib/metadata-export";

type Props = {
  assets: DemoAsset[];
  open: boolean;
};

export function MetadataDataPanel({ assets, open }: Props) {
  const rows = useMemo(() => buildEpisodeMetadataRows(assets), [assets]);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
        open ? "mb-6 grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="overflow-hidden">
        <div
          data-testid="metadata-data-panel"
          className="rounded-2xl border border-border-secondary bg-surface-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-secondary px-4 py-3">
            <div>
              <p className="text-sm font-medium">Jockey metadata overview</p>
              <p className="text-xs text-foreground-subtle">
                {rows.length} analyzed episode{rows.length === 1 ? "" : "s"} in this library
              </p>
            </div>
            <Button
              variant="outlined-gray"
              size="sm"
              data-testid="metadata-export-json"
              onClick={() =>
                downloadMetadataJson(assets, `${assets[0]?.store_key ?? "library"}-metadata.json`)
              }
            >
              <DownloadIcon className="size-3.5" />
              Export JSON
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-foreground-subtle">
              No analyzed episodes yet. Run Jockey hydration to populate this table.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead className="bg-surface-muted/80">
                  <tr className="border-b border-border-secondary">
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Episode</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Tags</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Characters</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Timeline</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Key scene</th>
                    <th className="px-4 py-2.5 font-medium text-foreground-subtle">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.asset_id}
                      className="border-b border-border-secondary align-top last:border-0 odd:bg-surface-white even:bg-surface-muted/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground-body">{row.episode_label}</p>
                        <p className="mt-0.5 font-tl-mono text-[11px] text-foreground-subtle">
                          {row.asset_id}
                        </p>
                      </td>
                      <td className="max-w-[180px] break-words px-4 py-3 text-foreground-secondary">{row.tags}</td>
                      <td className="max-w-[200px] break-words px-4 py-3 text-foreground-secondary">
                        {row.characters}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-foreground-secondary">
                        {row.timeline_label}
                      </td>
                      <td className="max-w-[220px] break-words px-4 py-3 text-foreground-secondary">
                        {row.key_scene}
                      </td>
                      <td className="max-w-xs break-words px-4 py-3 leading-relaxed text-foreground-secondary">
                        {row.summary_preview}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ToggleProps = {
  open: boolean;
  onToggle: () => void;
  assets: DemoAsset[];
};

export function MetadataDataToggle({ open, onToggle, assets }: ToggleProps) {
  const analyzedCount = assets.filter((a) => a.jockey_v2).length;
  if (analyzedCount === 0) return null;

  return (
    <IconButton
      type="button"
      variant="outlined-gray"
      size="sm"
      data-testid="metadata-raw-export-toggle"
      aria-expanded={open}
      aria-label={open ? "Hide metadata table" : "Show metadata table"}
      onClick={onToggle}
      className={cn(open && "border-foreground-subtle bg-surface-muted")}
    >
      <GridIcon className="size-3.5" />
    </IconButton>
  );
}
