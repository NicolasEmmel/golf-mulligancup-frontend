"use client";

import { cn } from "@/lib/utils";

export function SortableColumnHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-1 py-3 text-center sm:px-3">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex w-full items-center justify-center font-bold uppercase tracking-wide transition hover:opacity-80",
          active ? "underline decoration-2 underline-offset-4" : "",
        )}
      >
        {label}
      </button>
    </th>
  );
}
