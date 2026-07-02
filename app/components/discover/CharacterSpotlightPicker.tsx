"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  type AvatarColor,
  Button,
  CloseIcon,
  IconButton,
  TextField,
} from "@twelvelabs-io/react";
import type { StoreCharacterOption } from "@/lib/store-characters";

const AVATAR_COLORS: AvatarColor[] = ["peach", "purple", "yellow", "blue", "green", "pink"];

function characterInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function characterAvatarColor(name: string): AvatarColor {
  const code = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function CharacterAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return (
    <Avatar
      color={characterAvatarColor(name)}
      size={size === "sm" ? "sm" : "default"}
      aria-hidden
    >
      {characterInitials(name)}
    </Avatar>
  );
}

function CharacterRow({
  character,
  action,
  onAction,
}: {
  character: StoreCharacterOption;
  action: "add" | "remove";
  onAction: () => void;
}) {
  const content = (
    <>
      <CharacterAvatar name={character.name} />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm text-foreground-body">{character.name}</p>
        {(character.role || character.description) && (
          <p className="truncate text-xs text-foreground-subtle">
            {character.role ?? character.description}
          </p>
        )}
      </div>
      {action === "add" ? (
        <span className="shrink-0 text-xs font-medium text-foreground-subtle">Add</span>
      ) : (
        <IconButton
          type="button"
          variant="outlined-gray"
          size="sm"
          aria-label={`Remove ${character.name}`}
          className="size-7 shrink-0"
          onClick={onAction}
        >
          <CloseIcon className="size-3" />
        </IconButton>
      )}
    </>
  );

  if (action === "add") {
    return (
      <Button
        type="button"
        variant="ghosted"
        textAlign="left"
        className="h-auto w-full justify-start gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-border-secondary hover:bg-surface-muted/60"
        onClick={onAction}
      >
        {content}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-border-secondary hover:bg-surface-muted/60">
      {content}
    </div>
  );
}

export function CharacterSpotlightPicker({
  items,
  catalog,
  onChange,
}: {
  items: string[];
  catalog: StoreCharacterOption[];
  onChange: (items: string[]) => void;
}) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogByName = useMemo(
    () => new Map(catalog.map((character) => [character.name.toLowerCase(), character])),
    [catalog],
  );
  const selectedKeys = new Set(items.map((item) => item.toLowerCase()));
  const available = catalog.filter((character) => !selectedKeys.has(character.name.toLowerCase()));

  const addCharacter = (name: string) => {
    if (selectedKeys.has(name.toLowerCase())) return;
    onChange([...items, name]);
  };

  const selectedCharacters: StoreCharacterOption[] = items.map((name) => {
    return catalogByName.get(name.toLowerCase()) ?? { name };
  });

  return (
    <div className="space-y-4">
      {selectedCharacters.length > 0 ? (
        <ul className="space-y-1" data-testid="personalization-character-selected">
          {selectedCharacters.map((character) => (
            <li key={character.name}>
              <CharacterRow
                character={character}
                action="remove"
                onAction={() => onChange(items.filter((entry) => entry !== character.name))}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-foreground-subtle">No characters selected yet.</p>
      )}

      {catalog.length > 0 && (
        <div data-testid="personalization-character-catalog">
          <Button
            type="button"
            variant="outlined-gray"
            size="sm"
            data-testid="personalization-character-catalog-toggle"
            onClick={() => setCatalogOpen((open) => !open)}
          >
            {catalogOpen
              ? "Hide characters"
              : `View characters${available.length > 0 ? ` (${available.length})` : ""}`}
          </Button>

          {catalogOpen && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border-secondary bg-surface-muted/30">
              <div className="border-b border-border-secondary px-3 py-2">
                <p className="text-xs text-foreground-subtle">
                  From library analysis · {available.length} available
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {available.length > 0 ? (
                  <ul className="space-y-0.5">
                    {available.map((character) => (
                      <li
                        key={character.name}
                        data-testid={`personalization-character-option-${character.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <CharacterRow
                          character={character}
                          action="add"
                          onAction={() => addCharacter(character.name)}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-4 text-xs text-foreground-subtle">
                    All library characters are selected.
                  </p>
                )}
              </div>
            </div>
          )}

          <TextField
            data-testid="personalization-character-spotlight-input"
            className="mt-3 max-w-md"
            size="small"
            placeholder="Or type a custom name and press Enter"
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              const value = event.currentTarget.value.trim();
              if (!value) return;
              addCharacter(value);
              event.currentTarget.value = "";
            }}
          />
        </div>
      )}

      {catalog.length === 0 && (
        <TextField
          data-testid="personalization-character-spotlight-input"
          className="max-w-md"
          size="small"
          placeholder="Type a character name and press Enter"
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const value = event.currentTarget.value.trim();
            if (!value) return;
            addCharacter(value);
            event.currentTarget.value = "";
          }}
        />
      )}
    </div>
  );
}
