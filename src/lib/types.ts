/** Shapes shared between the API routes and the client. Deliberately narrow:
 *  only what the UI renders, so TMDB's sprawling payloads stay at the edge. */

export type Suggestion = {
  id: number;
  title: string;
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

export type MovieDetail = {
  id: number;
  title: string;
  tagline: string | null;
  overview: string | null;
  year: string | null;
  runtime: number | null;
  genres: string[];
  rating: number | null;
  voteCount: number;
  certification: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  director: string | null;
  cast: string[];
  region: string;
  /** JustWatch landing page for this title/region, supplied by TMDB. */
  justWatchLink: string | null;
  groups: OfferGroup[];
};

export type ApiError = { error: string; code: "no_credentials" | "not_found" | "upstream" | "bad_request" };
