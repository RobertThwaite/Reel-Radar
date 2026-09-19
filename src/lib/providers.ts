import type { Offer, OfferGroup, OfferKind, Suggestion } from "./types";

/** ---- Raw TMDB shapes (only the fields we touch) ---- */

export type RawMovie = {
  id: number;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
  vote_average?: number | null;
  popularity?: number | null;
};

export type RawProvider = {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  display_priority?: number | null;
};

export type RawRegionProviders = {
  link?: string | null;
  flatrate?: RawProvider[];
  free?: RawProvider[];
  ads?: RawProvider[];
  rent?: RawProvider[];
  buy?: RawProvider[];
};

/** ---- Normalisation ---- */

export function toYear(releaseDate: string | null | undefined): string | null {
  const year = (releaseDate ?? "").slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function toSuggestion(movie: RawMovie): Suggestion {
  return {
    id: movie.id,
    title: movie.title,
    year: toYear(movie.release_date),
    posterPath: movie.poster_path ?? null,
    rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
  };
}

/**
 * Rank search hits the way a person would expect: an exact title match first,
 * then titles that start with the query, then by TMDB popularity. Straight
 * relevance from TMDB buries famous films under obscure same-name ones.
 */
export function rankSuggestions(movies: RawMovie[], query: string): RawMovie[] {
  const q = query.trim().toLowerCase();
  const score = (m: RawMovie) => {
    const title = m.title.toLowerCase();
    if (title === q) return 0;
    if (title.startsWith(q)) return 1;
    if (title.includes(q)) return 2;
    return 3;
  };
  return [...movies].sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return (b.popularity ?? 0) - (a.popularity ?? 0);
  });
}

function toOffers(providers: RawProvider[] | undefined): Offer[] {
  const seen = new Set<number>();
  const offers: Offer[] = [];
  for (const p of providers ?? []) {
    if (seen.has(p.provider_id)) continue;
    seen.add(p.provider_id);
    offers.push({
      providerId: p.provider_id,
      name: p.provider_name,
      logoPath: p.logo_path ?? null,
      priority: p.display_priority ?? 999,
    });
  }
  return offers.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

const GROUP_META: Record<OfferKind, { label: string; blurb: string }> = {
  stream: { label: "Included with subscription", blurb: "No extra charge if you subscribe" },
  free: { label: "Free to watch", blurb: "Free, usually with ads" },
  rent: { label: "Rent", blurb: "Pay once, watch within a window" },
  buy: { label: "Buy", blurb: "Own it outright" },
};

/**
 * TMDB splits "free" and "ads" into separate buckets, but both mean "you can
 * watch it now for nothing", so they merge into one group. Empty groups are
 * dropped rather than rendered as empty shelves.
 */
export function buildGroups(region: RawRegionProviders | undefined): OfferGroup[] {
  if (!region) return [];
  const freeCombined = toOffers([...(region.free ?? []), ...(region.ads ?? [])]);
  const raw: Array<[OfferKind, Offer[]]> = [
    ["stream", toOffers(region.flatrate)],
    ["free", freeCombined],
    ["rent", toOffers(region.rent)],
    ["buy", toOffers(region.buy)],
  ];
  return raw
    .filter(([, offers]) => offers.length > 0)
    .map(([kind, offers]) => ({ kind, ...GROUP_META[kind], offers }));
}

/** Pulls the local classification (BBFC in GB, MPAA in US, ...) out of TMDB's release list. */
export function pickCertification(
  releaseDates: { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification?: string }> }> } | undefined,
  region: string,
): string | null {
  const entry = releaseDates?.results?.find((r) => r.iso_3166_1 === region);
  const cert = entry?.release_dates?.map((d) => d.certification).find((c) => c && c.trim());
  return cert ? cert.trim() : null;
}
