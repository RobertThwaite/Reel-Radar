import { NextResponse } from "next/server";
import { tmdb, TmdbError, hasCredentials } from "@/lib/tmdb";
import {
  buildGroups,
  pickCertification,
  pickContentRating,
  pickEpisodeRuntime,
  toYear,
  type RawRegionProviders,
} from "@/lib/providers";
import { normaliseRegion } from "@/lib/regions";
import type { ApiError, TitleDetail, TitleKind } from "@/lib/types";

export const runtime = "nodejs";

type RawDetail = {
  id: number;
  // TMDB names these differently for films and series.
  title?: string;
  name?: string;
  release_date?: string | null;
  first_air_date?: string | null;
  last_air_date?: string | null;

  tagline?: string | null;
  overview?: string | null;
  genres?: Array<{ name: string }>;
  vote_average?: number | null;
  vote_count?: number | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  credits?: {
    crew?: Array<{ job?: string; name: string }>;
    cast?: Array<{ name: string }>;
  };

  // Films
  runtime?: number | null;
  release_dates?: { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification?: string }> }> };

  // Series
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  episode_run_time?: number[];
  status?: string | null;
  created_by?: Array<{ name: string }>;
  content_ratings?: { results?: Array<{ iso_3166_1: string; rating?: string }> };

  "watch/providers"?: { results?: Record<string, RawRegionProviders> };
};

function isKind(value: string): value is TitleKind {
  return value === "movie" || value === "tv";
}

/** GET /api/title/movie/335984?region=GB — everything the detail panel renders, in one call. */
export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await context.params;
  const region = normaliseRegion(new URL(request.url).searchParams.get("region"));

  if (!isKind(kind) || !/^\d+$/.test(id)) {
    return NextResponse.json<ApiError>({ error: "Invalid title.", code: "bad_request" }, { status: 400 });
  }
  if (!hasCredentials()) {
    return NextResponse.json<ApiError>(
      { error: "TMDB credentials are not configured.", code: "no_credentials" },
      { status: 503 },
    );
  }

  // The age-rating endpoint differs by kind; everything else is shared.
  const appendix =
    kind === "movie"
      ? "watch/providers,credits,release_dates"
      : "watch/providers,credits,content_ratings";

  try {
    const data = await tmdb<RawDetail>(`/${kind}/${id}`, {
      language: "en-US",
      append_to_response: appendix,
    });

    const regionProviders = data["watch/providers"]?.results?.[region];
    const isMovie = kind === "movie";
    const startDate = isMovie ? data.release_date : data.first_air_date;

    const detail: TitleDetail = {
      id: data.id,
      kind,
      title: data.title ?? data.name ?? "Untitled",
      tagline: data.tagline?.trim() || null,
      overview: data.overview?.trim() || null,
      year: toYear(startDate),
      genres: (data.genres ?? []).map((g) => g.name),
      rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      voteCount: data.vote_count ?? 0,
      certification: isMovie
        ? pickCertification(data.release_dates, region)
        : pickContentRating(data.content_ratings, region),
      posterPath: data.poster_path ?? null,
      backdropPath: data.backdrop_path ?? null,
      cast: (data.credits?.cast ?? []).slice(0, 5).map((c) => c.name),
      region,
      justWatchLink: regionProviders?.link ?? null,
      groups: buildGroups(regionProviders),

      runtime: isMovie ? (data.runtime ?? null) : null,
      director: isMovie ? (data.credits?.crew?.find((c) => c.job === "Director")?.name ?? null) : null,

      seasons: isMovie ? null : (data.number_of_seasons ?? null),
      episodes: isMovie ? null : (data.number_of_episodes ?? null),
      endYear: isMovie ? null : toYear(data.last_air_date),
      status: isMovie ? null : (data.status?.trim() || null),
      creators: isMovie ? [] : (data.created_by ?? []).map((c) => c.name).slice(0, 3),
      episodeRuntime: isMovie ? null : pickEpisodeRuntime(data.episode_run_time),
    };

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof TmdbError) {
      return NextResponse.json<ApiError>({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json<ApiError>(
      { error: "Could not reach the film database.", code: "upstream" },
      { status: 502 },
    );
  }
}
