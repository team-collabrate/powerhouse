"use client";

import { useEffect } from "react";

export function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [auto]);

  return (
    <button
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3.5 text-[13px] font-medium text-neutral-800 hover:bg-neutral-50 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
