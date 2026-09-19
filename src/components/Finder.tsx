"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Backdrop } from "@/components/Backdrop";
import { MoviePanel } from "@/components/MoviePanel";
import { RegionPicker } from "@/components/RegionPicker";
import { SearchBar } from "@/components/SearchBar";
import { SetupNotice } from "@/components/SetupNotice";
import { ReelIcon } from "@/components/Icons";
import { normaliseRegion } from "@/lib/regions";
import { rememberFilm, rememberRegion, usePrefs } from "@/lib/store";
import type { MovieDetail, Suggestion } from "@/lib/types";

/** Shown to first-time visitors so the empty state is a starting point, not a void. */
const STARTERS = ["Blade Runner 2049", "Paddington 2", "Parasite", "Heat", "Arrival"];

/** A fetched detail, tagged with what it was fetched for — so "is this current?"
 *  is a comparison rather than another piece of state to keep in sync. */
type Loaded = { id: number; region: string; data: MovieDetail | null; error: string | null };

export function Finder() {
  const router = useRouter();
  const params = useSearchParams();
  const prefs = usePrefs();

  // The URL is the source of truth; stored preferences only fill the gaps.
  const region = normaliseRegion(params.get("region") ?? prefs.region);
  const filmParam = Number(params.get("film"));
  const filmId = Number.isInteger(filmParam) && filmParam > 0 ? filmParam : null;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const current = loaded && loaded.id === filmId && loaded.region === region;
  const movie = current ? loaded.data : null;
  const error = current ? loaded.error : null;
  const loading = filmId !== null && !current;

  useEffect(() => {
    if (filmId === null || current) return;

    let cancelled = false;
    fetch(`/api/movie/${filmId}?region=${region}`)
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setNeedsSetup(false);
          setLoaded({ id: filmId, region, data: body as MovieDetail, error: null });
        } else {
          if (body?.code === "no_credentials") setNeedsSetup(true);
          setLoaded({ id: filmId, region, data: null, error: body?.error ?? "Could not load that film." });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ id: filmId, region, data: null, error: "Could not load that film." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filmId, region, current]);

  const navigate = useCallback(
    (nextFilm: number | null, nextRegion: string, mode: "push" | "replace") => {
      const next = new URLSearchParams();
      if (nextFilm) next.set("film", String(nextFilm));
      next.set("region", nextRegion);
      router[mode](`?${next}`, { scroll: false });
    },
    [router],
  );

  const select = useCallback(
    (suggestion: Suggestion) => {
      rememberFilm(suggestion);
      navigate(suggestion.id, region, "push");
      // Let the panel mount before scrolling to it.
      requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [navigate, region],
  );

  const changeRegion = useCallback(
    (code: string) => {
      const next = normaliseRegion(code);
      rememberRegion(next);
      navigate(filmId, next, "replace");
    },
    [filmId, navigate],
  );

  const onCredentialsMissing = useCallback(() => setNeedsSetup(true), []);

  /** Starter chips carry a title, not an id, so resolve to the top hit first. */
  const openByTitle = useCallback(
    async (title: string) => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(title)}`);
        const body = await res.json();
        if (!res.ok) {
          if (body?.code === "no_credentials") setNeedsSetup(true);
          return;
        }
        const top = body.results?.[0] as Suggestion | undefined;
        if (top) select(top);
      } catch {
        /* the search bar is right there — no need to shout about it */
      }
    },
    [select],
  );

  const hasResult = filmId !== null || needsSetup;

  return (
    <>
      <Backdrop path={movie?.backdropPath ?? null} />

      <div className="relative z-10 mx-auto flex min-h-screen-safe w-full max-w-5xl flex-col px-4 pb-16 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-5 sm:py-7">
          <button
            type="button"
            onClick={() => navigate(null, region, "push")}
            className="group flex items-center gap-2.5"
            aria-label="Reel Radar — start a new search"
          >
            <ReelIcon className="size-7 text-gold transition-transform duration-500 group-hover:rotate-90" />
            <span className="marquee text-lg text-bone sm:text-xl">Reel Radar</span>
          </button>
          <RegionPicker value={region} onChange={changeRegion} />
        </header>

        <main className={`flex flex-1 flex-col ${hasResult ? "gap-8" : "justify-center gap-10 pb-24"}`}>
          {!hasResult && (
            <div className="animate-fade-in text-center">
              <p className="marquee text-xs text-gold/80">Every film. Every service. One search.</p>
              <h1 className="marquee mt-3 text-balance text-4xl leading-[0.95] text-bone sm:text-6xl">
                Where can I
                <br className="sm:hidden" /> watch it?
              </h1>
              <p className="mx-auto mt-4 max-w-md text-pretty text-sm text-haze sm:text-base">
                Type a film and see which services have it where you are — subscription, free, rent or buy.
              </p>
            </div>
          )}

          <div className={hasResult ? "sticky top-3 z-20" : "mx-auto w-full max-w-2xl"}>
            <SearchBar onSelect={select} onCredentialsMissing={onCredentialsMissing} compact={hasResult} />
          </div>

          {!hasResult && (
            <div className="mx-auto w-full max-w-2xl animate-fade-in">
              <p className="marquee text-center text-[11px] text-haze">
                {prefs.recents.length > 0 ? "Recently looked up" : "Try one of these"}
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-2">
                {prefs.recents.length > 0
                  ? prefs.recents.map((item) => (
                      <li key={item.id}>
                        <Chip onClick={() => select(item)}>
                          {item.title}
                          {item.year && <span className="ml-1.5 text-haze">{item.year}</span>}
                        </Chip>
                      </li>
                    ))
                  : STARTERS.map((title) => (
                      <li key={title}>
                        <Chip onClick={() => openByTitle(title)}>{title}</Chip>
                      </li>
                    ))}
              </ul>
            </div>
          )}

          <div ref={panelRef} className="scroll-mt-20">
            {needsSetup ? (
              <SetupNotice />
            ) : loading ? (
              <PanelSkeleton />
            ) : error ? (
              <p className="plate rounded-card px-5 py-8 text-center text-sm text-haze">{error}</p>
            ) : movie ? (
              <MoviePanel movie={movie} />
            ) : null}
          </div>
        </main>

        <footer className="mt-12 space-y-1 text-center text-[11px] leading-relaxed text-haze/70">
          <p>
            Film data from{" "}
            <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-haze">
              TMDB
            </a>
            ; availability from{" "}
            <a href="https://www.justwatch.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-haze">
              JustWatch
            </a>
            .
          </p>
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </footer>
      </div>
    </>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-bone/10 bg-bone/[0.04] px-3.5 py-1.5 text-sm text-bone/85 transition hover:-translate-y-0.5 hover:border-gold/40 hover:text-bone"
    >
      {children}
    </button>
  );
}

function PanelSkeleton() {
  return (
    <div className="plate animate-fade-in rounded-card p-5 sm:p-8" aria-hidden="true">
      <div className="grid gap-6 sm:gap-8 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <div className="sweep relative mx-auto aspect-[2/3] w-32 overflow-hidden rounded-xl bg-bone/5 sm:w-40 md:mx-0 md:w-full" />
        <div className="space-y-3">
          <div className="sweep relative h-9 w-3/4 overflow-hidden rounded bg-bone/5" />
          <div className="sweep relative h-4 w-1/3 overflow-hidden rounded bg-bone/5" />
          <div className="sweep relative h-20 w-full overflow-hidden rounded bg-bone/5" />
          <div className="sweep relative h-11 w-2/3 overflow-hidden rounded-2xl bg-bone/5" />
        </div>
      </div>
    </div>
  );
}
