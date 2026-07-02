"use client";

import { useState, type KeyboardEvent } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  CloseIcon,
  EntityChip,
  IconButton,
  Slider,
  TextField,
} from "@twelvelabs-io/react";
import { CharacterSpotlightPicker } from "@/components/discover/CharacterSpotlightPicker";
import type { PersonalizationConfig } from "@/lib/personalization-config";
import type { StoreCharacterOption } from "@/lib/store-characters";

function TagListEditor({
  items,
  onChange,
  placeholder,
  testId,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  testId: string;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const value = draft.trim();
    if (!value || items.includes(value)) return;
    onChange([...items, value]);
    setDraft("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground-subtle" aria-hidden />
            <EntityChip size="sm" className="max-w-full">
              <span className="truncate">{item}</span>
            </EntityChip>
            <IconButton
              type="button"
              variant="outlined-gray"
              size="sm"
              aria-label={`Remove ${item}`}
              className="size-6 shrink-0"
              onClick={() => onChange(items.filter((entry) => entry !== item))}
            >
              <CloseIcon className="size-3" />
            </IconButton>
          </li>
        ))}
      </ul>
      <TextField
        data-testid={testId}
        className="max-w-md"
        size="small"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={addItem}
      />
    </div>
  );
}

export function PersonalizationConfigTable({
  config,
  onChange,
  storeCharacters,
}: {
  config: PersonalizationConfig;
  onChange: (config: PersonalizationConfig) => void;
  storeCharacters: StoreCharacterOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Accordion
      type="single"
      collapsible
      value={open ? "config" : ""}
      onValueChange={(value) => setOpen(value === "config")}
      data-testid="personalization-config-table"
      className="mb-6 overflow-hidden rounded-2xl border border-border-secondary bg-surface-white shadow-sm"
    >
      <AccordionItem value="config" className="border-0">
        <AccordionTrigger
          chevron="right"
          data-testid="personalization-config-toggle"
          className="px-4 py-3 hover:bg-surface-muted/40 hover:no-underline"
        >
          <div className="text-left">
            <p className="text-sm font-medium">Audience configuration</p>
            <p className="text-xs text-foreground-subtle">
              Tune NLP signals, clip length, and negative targeting before running discovery
            </p>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="overflow-x-auto border-t border-border-secondary">
            <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-muted/80">
            <tr className="border-b border-border-secondary">
              <th className="w-48 px-4 py-2.5 text-xs font-medium text-foreground-subtle">
                Setting
              </th>
              <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-secondary align-top">
              <td className="px-4 py-4 font-medium text-foreground-body">Looking for</td>
              <td className="px-4 py-4">
                <TagListEditor
                  items={config.lookingFor}
                  onChange={(lookingFor) => onChange({ ...config, lookingFor })}
                  placeholder="Add an audience interest and press Enter"
                  testId="personalization-looking-for-input"
                />
              </td>
            </tr>
            <tr className="border-b border-border-secondary align-top">
              <td className="px-4 py-4 font-medium text-foreground-body">Max clip length</td>
              <td className="px-4 py-4">
                <div className="max-w-xs space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-tl-mono text-xs text-foreground-subtle">Minutes per clip</span>
                    <span
                      className="font-tl-mono text-sm text-foreground-body"
                      data-testid="personalization-clip-length-value"
                    >
                      {config.maxClipLengthMin} min
                    </span>
                  </div>
                  <Slider
                    min={5}
                    max={90}
                    step={5}
                    value={[config.maxClipLengthMin]}
                    onValueChange={([value]) =>
                      onChange({ ...config, maxClipLengthMin: value })
                    }
                    aria-label="Max clip length in minutes"
                    data-testid="personalization-clip-length-slider"
                    translucentOnPress
                  />
                </div>
              </td>
            </tr>
            <tr className="border-b border-border-secondary align-top">
              <td className="px-4 py-4">
                <span className="font-medium text-foreground-body">Negative targeting</span>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Ad-tech exclusion list — content to suppress
                </p>
              </td>
              <td className="px-4 py-4">
                <TagListEditor
                  items={config.negativeTargeting}
                  onChange={(negativeTargeting) => onChange({ ...config, negativeTargeting })}
                  placeholder="Add excluded theme and press Enter"
                  testId="personalization-negative-targeting-input"
                />
              </td>
            </tr>
            <tr className="align-top">
              <td className="px-4 py-4">
                <span className="font-medium text-foreground-body">Character spotlight</span>
                <p className="mt-1 text-xs text-foreground-subtle">
                  Cast or personas to prioritize in recommendations
                </p>
              </td>
              <td className="px-4 py-4">
                <CharacterSpotlightPicker
                  items={config.characterSpotlight}
                  catalog={storeCharacters}
                  onChange={(characterSpotlight) => onChange({ ...config, characterSpotlight })}
                />
              </td>
            </tr>
          </tbody>
            </table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
