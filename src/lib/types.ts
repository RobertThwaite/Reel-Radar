/** Shapes shared between the API routes and the client. Deliberately narrow:
 *  only what the UI renders, so TMDB's sprawling payloads stay at the edge. */

/** TMDB models films and series separately, with different field names and
 *  different endpoints, so the kind travels with every title we handle. */
export type TitleKind = "movie" | "tv";

export type Suggestion = {
  id: number;
  kind: TitleKind;
  title: string;
  /** First-air year for a series, release year for a film. */
  year: string | null;
  posterPath: string | null;
  rating: number | null;
};

export type Offer = {
  providerId: number;
  name: string;
  logoPath: string | null;
  /** Lower sorts first. TMDB's display priority, region-adjusted. */
  priority: number;
};

/** The four ways you can actually watch something, in the order we show them. */
export type OfferKind = "stream" | "free" | "rent" | "buy";

export type OfferGroup = {
  kind: OfferKind;
  label: string;
  blurb: string;
  offers: Offer[];
};

export type TitleDetail = {
  id: number;
  kind: TitleKind;
  title: string;
  tagline: string | null;
  overview: string | null;
  year: string | null;
  genres: string[];
  rating: number | null;
  voteCount: number;
  /** BBFC/MPAA for films, the TV content rating for series. */
  certification: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  cast: string[];
  region: string;
  /** JustWatch landing page for this title/region, supplied by TMDB. */
  justWatchLink: string | null;
  groups: OfferGroup[];

  /** Films only. */
  runtime: number | null;
  director: string | null;

  /** Series only. */
  seasons: number | null;
  episodes: number | null;
  /** Last-air year, so an ended series can show its run as a range. */
  endYear: string | null;
  /** TMDB's production status, e.g. "Returning Series" or "Ended". */
  status: string | null;
  creators: string[];
  /** Typical episode length, when TMDB reports a consistent one. */
  episodeRuntime: number | null;
};

export type ApiError = { error: string; code: "no_credentials" | "not_found" | "upstream" | "bad_request" };
