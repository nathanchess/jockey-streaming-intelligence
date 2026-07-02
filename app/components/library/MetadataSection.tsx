import type { ReactNode } from "react";
import { Text } from "@twelvelabs-io/react";

type Props = {
  title: string;
  children: ReactNode;
  testId?: string;
};

export function MetadataSection({ title, children, testId }: Props) {
  return (
    <section className="mb-8 last:mb-0" data-testid={testId}>
      <div className="mb-4 flex items-center gap-3">
        <Text
          as="h3"
          variant="all-caps-mini"
          className="shrink-0 tracking-[0.14em] text-foreground-subtle"
        >
          {title}
        </Text>
        <div className="h-px flex-1 bg-border-secondary" />
      </div>
      {children}
    </section>
  );
}
