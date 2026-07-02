"use client";

import { Button, Chip, Switch } from "@twelvelabs-io/react";
import { useEffect } from "react";
import { useDemoStore } from "@/store/demo-store";

export function DevDrawer() {
  const settingsOpen = useDemoStore((s) => s.settingsOpen);
  const setSettingsOpen = useDemoStore((s) => s.setSettingsOpen);
  const developerMode = useDemoStore((s) => s.developerMode);
  const setDeveloperMode = useDemoStore((s) => s.setDeveloperMode);
  const lastApiExchange = useDemoStore((s) => s.lastApiExchange);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen, setSettingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="Close settings"
        onClick={() => setSettingsOpen(false)}
      />
      <aside
        data-testid="developer-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="developer-drawer-title"
        className="relative flex h-full w-full max-w-lg flex-col border-l border-border-secondary bg-surface-white shadow-xl drawer-panel-enter"
      >
        <div className="flex items-center justify-between border-b border-border-secondary px-5 py-4">
          <h2 id="developer-drawer-title" className="text-lg font-normal">
            Settings
          </h2>
          <Button variant="outlined-gray" size="sm" onClick={() => setSettingsOpen(false)}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Developer mode</p>
              <p className="text-xs text-foreground-subtle">
                Show raw Jockey API request and response
              </p>
            </div>
            <Switch
              checked={developerMode}
              onCheckedChange={setDeveloperMode}
              data-testid="developer-mode-switch"
            />
          </div>
          {developerMode && lastApiExchange && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Chip variant={lastApiExchange.source === "cache" ? "gray-outline" : "success"}>
                  {lastApiExchange.source === "cache" ? "Cached" : "Live"}
                </Chip>
                <span className="font-tl-mono text-xs text-foreground-subtle">
                  {lastApiExchange.endpoint}
                </span>
              </div>
              {lastApiExchange.session_id && (
                <p className="font-tl-mono text-xs text-foreground-subtle">
                  session_id: {lastApiExchange.session_id}
                </p>
              )}
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-foreground-subtle">
                  Request
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-surface-muted p-3 font-tl-mono text-xs">
                  {JSON.stringify(lastApiExchange.request, null, 2)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-foreground-subtle">
                  Response
                </p>
                <pre className="max-h-64 overflow-auto rounded-lg bg-surface-muted p-3 font-tl-mono text-xs">
                  {JSON.stringify(lastApiExchange.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {developerMode && !lastApiExchange && (
            <p className="text-sm text-foreground-subtle">
              Trigger a search, discovery, or programming action to see API details.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
