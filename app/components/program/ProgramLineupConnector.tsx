"use client";

export function ProgramLineupConnector() {
  return (
    <div
      className="relative h-4 pl-8"
      data-testid="program-lineup-connector"
      aria-hidden
    >
      <div className="absolute inset-y-0 left-8 w-px bg-border-secondary/80" />
    </div>
  );
}
