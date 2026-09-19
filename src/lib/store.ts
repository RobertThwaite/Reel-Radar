import { useSyncExternalStore } from "react";
import { DEFAULT_REGION, normaliseRegion } from "./regions";
import type { Suggestion } from "./types";

/**
 * localStorage-backed preferences exposed as an external store.
 *
 * Reading browser storage during render would break the server pass, and
 * copying it into state from an effect causes the cascading render React 19
 * warns about — `useSyncExternalStore` is the sanctioned way to read a
 * client-only source, with a server snapshot for the prerender.
 */

const REGION_KEY = "reel-radar:region";
const RECENTS_KEY = "reel-radar:recents";
export const MAX_RECENTS = 6;

export type Prefs = { region: string; recents: Suggestion[] };

const SERVER_SNAPSHOT: Prefs = { region: DEFAULT_REGION, recents: [] };

const listeners = new Set<() => void>();
/** Snapshots must be referentially stable between writes or React re-renders forever. */
let cache: Prefs | null = null;

function readStorage(): Prefs {
  try {
    const region = normaliseRegion(window.localStorage.getItem(REGION_KEY));
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const recents = Array.isArray(parsed) ? (parsed as Suggestion[]).slice(0, MAX_RECENTS) : [];
    return { region, recents };
  } catch {
    // Private mode, blocked storage or a corrupt entry: fall back to defaults.
    return SERVER_SNAPSHOT;
  }
}

function persist(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* non-fatal — the session still works, it just won't be remembered */
  }
}

function commit(next: Prefs) {
  cache = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Prefs {
  return (cache ??= readStorage());
}

function getServerSnapshot(): Prefs {
  return SERVER_SNAPSHOT;
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function rememberRegion(code: string) {
  const region = normaliseRegion(code);
  persist(REGION_KEY, region);
  commit({ ...getSnapshot(), region });
}

export function rememberFilm(film: Suggestion) {
  const current = getSnapshot();
  const recents = [film, ...current.recents.filter((r) => r.id !== film.id)].slice(0, MAX_RECENTS);
  persist(RECENTS_KEY, JSON.stringify(recents));
  commit({ ...current, recents });
}
