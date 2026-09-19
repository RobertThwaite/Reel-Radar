/** Small presentation helpers, kept pure so they can be unit tested. */

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function tmdbImage(
  path: string | null | undefined,
  size: "w92" | "w154" | "w342" | "w500" | "w780" | "w1280" | "original",
): string | null {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

/** Splits a title around the matched query so the UI can bold the hit. */
export function highlight(title: string, query: string): [string, string, string] {
  const q = query.trim();
  if (!q) return [title, "", ""];
  const at = title.toLowerCase().indexOf(q.toLowerCase());
  if (at === -1) return [title, "", ""];
  return [title.slice(0, at), title.slice(at, at + q.length), title.slice(at + q.length)];
}
