import "server-only";

/** Overridable so the UI can be exercised against a local fixture server in tests. */
const BASE = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";

export class TmdbError extends Error {
  constructor(
    message: string,
    readonly code: "no_credentials" | "not_found" | "upstream",
    readonly status: number,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

export function hasCredentials(): boolean {
  return Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);
}

/**
 * One request against TMDB v3. Supports both credential styles: the v4 bearer
 * token (preferred) and the legacy v3 key appended to the query string.
 */
export async function tmdb<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 60 * 60,
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  const key = process.env.TMDB_API_KEY;
  if (!token && !key) {
    throw new TmdbError("TMDB credentials are not configured.", "no_credentials", 503);
  }

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  if (!token && key) url.searchParams.set("api_key", key);

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    // Search is volatile, details are not; callers tune this.
    next: { revalidate },
  });

  if (res.status === 404) {
    throw new TmdbError("That film isn't in the database.", "not_found", 404);
  }
  if (!res.ok) {
    throw new TmdbError(`TMDB responded with ${res.status}.`, "upstream", 502);
  }
  return (await res.json()) as T;
}
