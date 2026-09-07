"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "react-feather";
import type { SearchHit, SearchResults } from "@/lib/queries/search";

type Group = { label: string; hits: SearchHit[] };

export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the search from anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (ok) {
            setResults(j.data as SearchResults);
            setActive(0);
          }
        })
        .catch(() => {
          /* aborted or offline */
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const groups: Group[] = results
    ? [
        { label: "Projects", hits: results.projects },
        { label: "Clients", hits: results.clients },
        { label: "Invoices", hits: results.invoices },
      ].filter((g) => g.hits.length > 0)
    : [];
  const flat = groups.flatMap((g) => g.hits);

  function go(hit: SearchHit) {
    setOpen(false);
    setQ("");
    setResults(null);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active]);
    }
  }

  return (
    <div
      ref={boxRef}
      className="relative ml-2 hidden max-w-[320px] flex-1 md:block"
    >
      <div className="relative flex items-center">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 text-ink-3"
        />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search projects, clients, invoices…"
          className="h-9 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
          {flat.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-ink-3">
              {loading ? "Searching…" : `No matches for “${q.trim()}”`}
            </p>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto py-1">
              {groups.map((g) => (
                <li key={g.label}>
                  <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-ink-3">
                    {g.label}
                  </p>
                  {g.hits.map((hit) => {
                    const idx = flat.indexOf(hit);
                    return (
                      <button
                        key={hit.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(hit)}
                        className={`flex w-full flex-col items-start px-3 py-2 text-left ${
                          idx === active ? "bg-surface-sunken" : ""
                        }`}
                      >
                        <span className="text-[12.5px] font-medium text-ink">
                          {hit.label}
                        </span>
                        <span className="truncate text-[11.5px] text-ink-3">
                          {hit.sub}
                        </span>
                      </button>
                    );
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
