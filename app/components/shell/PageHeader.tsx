"use client";

import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Text } from "@twelvelabs-io/react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <RevealOnScroll className="mb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <Text
              as="p"
              variant="mono-paragraph-mini"
              className="mb-2 uppercase tracking-widest text-foreground-subtle"
            >
              {eyebrow}
            </Text>
          )}
          <Text as="h1" variant="display-regular" className="tracking-tight text-foreground-body">
            {title}
          </Text>
          {subtitle && (
            <Text
              as="p"
              variant="paragraph-medium"
              className="mt-2 max-w-2xl text-foreground-secondary"
            >
              {subtitle}
            </Text>
          )}
        </div>
        {action}
      </header>
    </RevealOnScroll>
  );
}
