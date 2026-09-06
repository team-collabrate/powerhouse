"use client";

import { Plus } from "react-feather";
import { ClientDialog } from "./ClientDialog";
import { useCan } from "@/components/providers/SessionProvider";

export function NewClientButton() {
  if (!useCan("client:write")) return null;
  return (
    <ClientDialog
      trigger={(open) => (
        <button
          onClick={open}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <Plus size={15} />
          New client
        </button>
      )}
    />
  );
}
