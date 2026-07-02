"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AssetsIcon,
  Button,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  cn,
  ProfileIcon,
  SearchIcon,
  SettingsIcon,
  TwelveLabsLogo,
} from "@twelvelabs-io/react";
import { DemoBadge } from "./DemoBadge";
import { StoreSwitcher } from "./StoreSwitcher";
import { useDemoStore } from "@/store/demo-store";
import type { StoreKey } from "@/lib/types";

const NAV = [
  { tab: "library", label: "Library", href: (s: string) => `/${s}/library`, Icon: AssetsIcon },
  { tab: "explore", label: "Explore", href: (s: string) => `/${s}/explore`, Icon: SearchIcon },
  { tab: "discover", label: "Personalization", href: (s: string) => `/${s}/discover`, Icon: ProfileIcon },
  { tab: "program", label: "Program", href: (s: string) => `/${s}/program`, Icon: CalendarIcon },
] as const;

type Props = {
  storeKey?: StoreKey;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function AppSidebar({ storeKey, collapsed = false, onToggleCollapse }: Props) {
  const pathname = usePathname();
  const setSettingsOpen = useDemoStore((s) => s.setSettingsOpen);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-full max-h-[100dvh] shrink-0 flex-col border-r border-border-secondary bg-surface-white transition-[width] duration-200",
        collapsed ? "w-16" : "w-[240px]",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border-secondary",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-3",
        )}
      >
        {!collapsed && (
          <Link href="/" className="flex min-w-0 flex-1 items-center">
            <TwelveLabsLogo className="h-8 w-auto" />
          </Link>
        )}
        {onToggleCollapse && (
          <Button
            type="button"
            variant="outlined-gray"
            size="regular"
            onClick={onToggleCollapse}
            className="size-8 shrink-0 p-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRightIcon className="size-4" />
            ) : (
              <ChevronLeftIcon className="size-4" />
            )}
          </Button>
        )}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
        {storeKey ? (
          NAV.map(({ tab, label, href, Icon }) => {
            const path = href(storeKey);
            const active = pathname === path;
            return (
              <Link
                key={tab}
                href={path}
                data-testid={`sidebar-nav-${tab}`}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm transition-all duration-150 motion-safe:hover:translate-x-0.5",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-surface-card text-foreground-body"
                    : "text-foreground-subtle hover:bg-surface-card hover:text-foreground-body",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })
        ) : (
          <Link
            href="/"
            className={cn(
              "flex items-center rounded-lg px-3 py-2.5 text-sm",
              pathname === "/"
                ? "bg-surface-card text-foreground-body"
                : "text-foreground-subtle hover:bg-surface-card",
              collapsed && "justify-center px-2",
            )}
          >
            {!collapsed && "Overview"}
          </Link>
        )}
      </nav>

      <div className="shrink-0 border-t border-border-secondary px-2 py-4">
        <DemoBadge collapsed={collapsed} />
        {storeKey && <StoreSwitcher storeKey={storeKey} collapsed={collapsed} />}
        <Button
          type="button"
          variant="ghosted"
          data-testid="sidebar-settings"
          onClick={() => setSettingsOpen(true)}
          className={cn(
            "mt-2 h-auto w-full justify-start rounded-lg text-sm font-normal text-foreground-subtle hover:bg-surface-card hover:text-foreground-body",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <SettingsIcon className="size-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Button>
      </div>
    </aside>
  );
}
