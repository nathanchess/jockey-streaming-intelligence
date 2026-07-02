"use client";

import { useRouter } from "next/navigation";
import {
  Button,
  ChevronDownIcon,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  cn,
} from "@twelvelabs-io/react";
import { STORE_KEYS, type StoreKey } from "@/lib/types";

const LABELS: Record<StoreKey, string> = {
  hells_kitchen: "Hell's Kitchen",
  lizzie_bennet: "Lizzie Bennet",
  omeleto_reserve: "The Reserve",
  french_chef: "French Chef",
};

export function StoreSwitcher({
  storeKey,
  collapsed,
}: {
  storeKey: StoreKey;
  collapsed?: boolean;
}) {
  const router = useRouter();

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="outlined-gray"
          size="sm"
          className={cn(
            "w-full justify-between gap-2 font-medium shadow-sm",
            collapsed && "size-9 p-0",
          )}
          data-testid="store-switcher"
        >
          {!collapsed && (
            <>
              <span className="truncate">{LABELS[storeKey]}</span>
              <ChevronDownIcon className="size-4 shrink-0 text-foreground-subtle" />
            </>
          )}
          {collapsed && <ChevronDownIcon className="size-4" />}
        </Button>
      </MenuTrigger>
      <MenuContent align="start" className="w-56">
        <p className="mb-2 px-2 text-xs font-medium text-foreground-secondary">
          Switch library
        </p>
        {STORE_KEYS.map((key) => (
          <MenuItem
            key={key}
            size="small"
            className={cn(
              key === storeKey && "bg-surface-primary font-medium text-foreground-primary",
            )}
            onClick={() => router.push(`/${key}/library`)}
          >
            {LABELS[key]}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
