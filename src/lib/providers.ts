import type { Offer, OfferGroup, OfferKind, Suggestion, TitleKind } from "./types";

/** ---- Raw TMDB shapes (only the fields we touch) ---- */

/**
 * Films and series differ in the two fields we most need: TMDB calls them
 * `title`/`release_date` on a film and `name`/`first_air_date` on a series.
 * Both spellings are optional here so one shape covers search results of
 * either kind, including `/search/multi`.
 */
export type RawTitle = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  release_date?: string | null;
  first_air_date?: string | null;
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

export function toYear(date: string | null | undefined): string | null {
  const year = (date ?? "").slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

/** Whichever of TMDB's two spellings this payload happens to use. */
export function titleOf(raw: RawTitle): string {
  return raw.title ?? raw.name ?? "";
}

export function dateOf(raw: RawTitle): string | null | undefined {
  return raw.release_date ?? raw.first_air_date;
}

export function toSuggestion(raw: RawTitle, kind: TitleKind): Suggestion {
  return {
    id: raw.id,
    kind,
    title: titleOf(raw),
    year: toYear(dateOf(raw)),
    posterPath: raw.poster_path ?? null,
    rating: raw.vote_average ? Math.round(raw.vote_average * 10) / 10 : null,
  };
}

/**
 * `/search/multi` also returns people, who have no watch providers and nothing
 * to show. Anything that isn't a film or series is dropped here.
 */
export function toSuggestions(results: RawTitle[]): Suggestion[] {
  const out: Suggestion[] = [];
  for (const raw of results) {
    if (raw.media_type !== "movie" && raw.media_type !== "tv") continue;
    if (!titleOf(raw)) continue;
    out.push(toSuggestion(raw, raw.media_type));
  }
  return out;
}

/**
 * Rank search hits the way a person would expect: an exact title match first,
 * then titles that start with the query, then by TMDB popularity. Straight
 * relevance from TMDB buries famous titles under obscure same-name ones.
 */
export function rankSuggestions(titles: RawTitle[], query: string): RawTitle[] {
  const q = query.trim().toLowerCase();
  const score = (raw: RawTitle) => {
    const title = titleOf(raw).toLowerCase();
    if (title === q) return 0;
    if (title.startsWith(q)) return 1;
    if (title.includes(q)) return 2;
    return 3;
  };
  return [...titles].sort((a, b) => {
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

/** Local film classification (BBFC in GB, MPAA in US, ...) from TMDB's release list. */
export function pickCertification(
  releaseDates: { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification?: string }> }> } | undefined,
  region: string,
): string | null {
  const entry = releaseDates?.results?.find((r) => r.iso_3166_1 === region);
  const cert = entry?.release_dates?.map((d) => d.certification).find((c) => c && c.trim());
  return cert ? cert.trim() : null;
}

/** Series carry their age rating in a separate, flatter structure. */
export function pickContentRating(
  contentRatings: { results?: Array<{ iso_3166_1: string; rating?: string }> } | undefined,
  region: string,
): string | null {
  const rating = contentRatings?.results?.find((r) => r.iso_3166_1 === region)?.rating;
  return rating && rating.trim() ? rating.trim() : null;
}

/**
 * TMDB reports episode runtimes as a list, which can be empty or wildly mixed
 * for anthologies. Only a single consistent value is worth showing.
 */
export function pickEpisodeRuntime(runtimes: number[] | undefined): number | null {
  const valid = (runtimes ?? []).filter((n) => typeof n === "number" && n > 0);
  if (valid.length === 0) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  // More than a 10-minute spread means there's no "typical" episode.
  return max - min <= 10 ? Math.round((min + max) / 2) : null;
}
