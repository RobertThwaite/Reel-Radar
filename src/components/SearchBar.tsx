"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { highlight, tmdbImage } from "@/lib/format";
import type { Suggestion } from "@/lib/types";
import { CloseIcon, SearchIcon, StarIcon } from "./Icons";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 180;

/** The results we hold are always tagged with the term that produced them, so
 *  "is this list current?" is a comparison rather than a piece of state to sync. */
type Settled = { term: string; results: Suggestion[]; error: string | null };

type Props = {
  onSelect: (movie: Suggestion) => void;
  onCredentialsMissing: () => void;
  compact?: boolean;
};

export function SearchBar({ onSelect, onCredentialsMissing, compact = false }: Props) {
  const [query, setQuery] = useState("");
  const [settled, setSettled] = useState<Settled>({ term: "", results: [], error: null });
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const term = query.trim();
  const searchable = term.length >= MIN_QUERY;
  const current = settled.term === term;

  // Everything below is derived: no effect ever copies fetch results into a
  // second piece of state, so a stale term can't leak into the list.
  const loading = searchable && !current;
  const results = searchable && current ? settled.results : [];
  const error = searchable && current ? settled.error : null;
  const activeIndex = active < results.length ? active : -1;
  const open = focused && searchable;

  useEffect(() => {
    if (!searchable || current) return;

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        if (res.ok) {
          setSettled({ term, results: body.results ?? [], error: null });
        } else {
          if (body?.code === "no_credentials") onCredentialsMissing();
          setSettled({ term, results: [], error: body?.error ?? "Search is unavailable right now." });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSettled({ term, results: [], error: "Search is unavailable right now." });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term, searchable, current, onCredentialsMissing]);

  // Dismiss the listbox on an outside click, the way a native combobox does.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const choose = useCallback(
    (movie: Suggestion) => {
      abortRef.current?.abort();
      setQuery(movie.title);
      setSettled({ term: movie.title.trim(), results: [], error: null });
      setFocused(false);
      setActive(-1);
      inputRef.current?.blur();
      onSelect(movie);
    },
    [onSelect],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setFocused(false);
      setActive(-1);
      return;
    }
    if (event.key === "Tab") {
      setFocused(false);
      return;
    }
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocused(true);
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocused(true);
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[activeIndex >= 0 ? activeIndex : 0]);
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setQuery("");
    setActive(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`plate flex items-center gap-3 rounded-full transition-all duration-300 ${
          compact ? "px-4 py-2.5" : "px-5 py-3.5 sm:px-6 sm:py-4"
        } ${open ? "ring-1 ring-gold/40" : "ring-1 ring-transparent"} focus-within:ring-gold/70`}
      >
        <SearchIcon className={`shrink-0 text-gold ${compact ? "size-4" : "size-5"}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          aria-label="Search for a film or series"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={compact ? "Search another title…" : "Search a film or series…"}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setFocused(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          className={`min-w-0 flex-1 bg-transparent text-bone placeholder:text-haze/70 focus:outline-none ${
            compact ? "text-[15px]" : "text-lg sm:text-xl"
          }`}
        />
        {loading && <Spinner />}
        {query && !loading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-1 text-haze transition hover:bg-bone/10 hover:text-bone"
          >
            <CloseIcon className="size-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+0.6rem)] z-30 animate-fade-up">
          <div className="plate max-h-[min(26rem,60dvh)] overflow-y-auto overscroll-contain rounded-3xl bg-ink-soft p-1.5 shadow-2xl shadow-black/60 scrollbar-none">
            {loading ? (
              <SkeletonRows />
            ) : error ? (
              <p className="px-4 py-5 text-sm text-haze">{error}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-5 text-sm text-haze">
                Nothing matching <span className="text-bone">&ldquo;{term}&rdquo;</span>. Try a different spelling?
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label="Search suggestions">
                {results.map((movie, index) => (
                  <li key={movie.id} role="presentation">
                    <button
                      id={`${listId}-opt-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      type="button"
                      onPointerEnter={() => setActive(index)}
                      onClick={() => choose(movie)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors ${
                        index === activeIndex ? "bg-bone/10" : "hover:bg-bone/5"
                      }`}
                    >
                      <Thumb movie={movie} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-bone">
                          <Highlighted title={movie.title} query={term} />
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-xs text-haze">
                          <span
                            className={`marquee rounded px-1.5 text-[10px] leading-[1.35] ${
                              movie.kind === "tv"
                                ? "bg-sky-400/15 text-sky-300"
                                : "bg-gold/15 text-gold"
                            }`}
                          >
                            {movie.kind === "tv" ? "Series" : "Film"}
                          </span>
                          {movie.year && <span>{movie.year}</span>}
                          {movie.rating ? (
                            <span className="flex items-center gap-1">
                              <StarIcon className="size-3 text-gold-dim" />
                              {movie.rating.toFixed(1)}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Highlighted({ title, query }: { title: string; query: string }) {
  const [before, match, after] = highlight(title, query);
  if (!match) return <>{title}</>;
  return (
    <>
      {before}
      <mark className="bg-transparent font-semibold text-gold">{match}</mark>
      {after}
    </>
  );
}

function Thumb({ movie }: { movie: Suggestion }) {
  const src = tmdbImage(movie.posterPath, "w92");
  return (
    <span className="relative flex h-14 w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-edge">
      {src ? (
        <Image src={src} alt="" width={38} height={56} className="h-full w-full object-cover" unoptimized />
      ) : (
        <span className="marquee text-[9px] text-haze">N/A</span>
      )}
    </span>
  );
}

function SkeletonRows() {
  return (
    <ul className="space-y-1 p-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3 px-1.5 py-2">
          <span className="sweep relative h-14 w-[38px] overflow-hidden rounded-md bg-bone/5" />
          <span className="flex-1 space-y-2">
            <span
              className="sweep relative block h-3.5 overflow-hidden rounded bg-bone/5"
              style={{ width: `${70 - i * 12}%` }}
            />
            <span className="sweep relative block h-2.5 w-16 overflow-hidden rounded bg-bone/5" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Searching"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-bone/20 border-t-gold"
    />
  );
}
