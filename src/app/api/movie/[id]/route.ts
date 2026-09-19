import { NextResponse } from "next/server";
import { tmdb, TmdbError, hasCredentials } from "@/lib/tmdb";
import { buildGroups, pickCertification, toYear, type RawRegionProviders } from "@/lib/providers";
import { normaliseRegion } from "@/lib/regions";
import type { ApiError, MovieDetail } from "@/lib/types";

export const runtime = "nodejs";

type RawDetail = {
  id: number;
  title: string;
  tagline?: string | null;
  overview?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  genres?: Array<{ name: string }>;
  vote_average?: number | null;
  vote_count?: number | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  credits?: {
    crew?: Array<{ job?: string; name: string }>;
    cast?: Array<{ name: string }>;
  };
  release_dates?: { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification?: string }> }> };
  "watch/providers"?: { results?: Record<string, RawRegionProviders> };
};

/** GET /api/movie/123?region=GB — everything the detail panel renders, in one call. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const region = normaliseRegion(new URL(request.url).searchParams.get("region"));

  if (!/^\d+$/.test(id)) {
    return NextResponse.json<ApiError>({ error: "Invalid film id.", code: "bad_request" }, { status: 400 });
  }
  if (!hasCredentials()) {
    return NextResponse.json<ApiError>(
      { error: "TMDB credentials are not configured.", code: "no_credentials" },
      { status: 503 },
    );
  }

  try {
    const data = await tmdb<RawDetail>(`/movie/${id}`, {
      language: "en-US",
      append_to_response: "watch/providers,credits,release_dates",
    });

    const regionProviders = data["watch/providers"]?.results?.[region];
    const director = data.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;

    const detail: MovieDetail = {
      id: data.id,
      title: data.title,
      tagline: data.tagline?.trim() || null,
      overview: data.overview?.trim() || null,
      year: toYear(data.release_date),
      runtime: data.runtime ?? null,
      genres: (data.genres ?? []).map((g) => g.name),
      rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      voteCount: data.vote_count ?? 0,
      certification: pickCertification(data.release_dates, region),
      posterPath: data.poster_path ?? null,
      backdropPath: data.backdrop_path ?? null,
      director,
      cast: (data.credits?.cast ?? []).slice(0, 5).map((c) => c.name),
      region,
      justWatchLink: regionProviders?.link ?? null,
      groups: buildGroups(regionProviders),
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
