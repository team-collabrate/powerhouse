"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A button for a not-yet-built feature. Shows a small "coming soon" bubble
 * only when clicked (never on hover, never on load) and it dismisses
 * itself (auto-timeout, outside click, or Escape).
 */
export function ComingSoonButton({
  className,
  children,
  message = "This feature is coming soon.",
  bubbleClassName,
}: {
  className?: string;
  children: React.ReactNode;
  message?: string;
  bubbleClassName?: string;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const hide = () => setShow(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) hide();
    };
    const timer = setTimeout(hide, 3000);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [show]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className={className}
      >
        {children}
      </button>
      {show && (
        <div
          role="status"
          className={cn(
            "absolute right-0 top-full z-30 mt-2 whitespace-nowrap rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-1.5 text-[12px] font-medium text-ink shadow-[var(--shadow-pop)]",
            bubbleClassName,
          )}
        >
          {message}
        </div>
      )}
    </div>
  );
}
